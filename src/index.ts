import { delay } from "https://deno.land/std@0.93.0/async/delay.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";

type Conversations = {
  channels: Array<Channel>;
  response_metadata: {
    next_cursor: string;
  };
};

type Channel = {
  id: string;
  name: string;
};

type History = {
  messages: Array<Message>;
};

type Message = {
  bot_id?: string;
  subtype?: string;
};

type AggregatedData = {
  id: string;
  name: string;
  messages: Array<Message>;
};

const TOKEN = Deno.env.get("TOKEN");
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? TOKEN;
const POST_CHANNEL = Deno.env.get("POST_CHANNEL");

if (TOKEN == null || BOT_TOKEN == null || POST_CHANNEL == null) {
  console.error("Environment variable is not set");

  Deno.exit(1);
}

const RANKING_COUNT = Number(Deno.env.get("RANKING_COUNT") ?? "20");
const USER_NAME = Deno.env.get("USER_NAME") ?? "hot-channels";
const ICON_EMOJI = Deno.env.get("ICON_EMOJI") ?? ":tada:";

const DATE_SWITCHING_HOUR = Number(Deno.env.get("DATE_SWITCHING_HOUR") ?? "4");

const DEFAULT_FETCH_OPTIONS = {
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
  },
};

const DEFAULT_POST_OPTIONS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": `Bearer ${BOT_TOKEN}`,
  },
};

const DEFAULT_CHANNEL_LIST_OPTIONS = [
  "limit=1000",
  "exclude_archived=true",
];

const DEFAULT_HISTORY_OPTIONS = [
  "limit=1000",
];

const MOMENT = moment().utcOffset("+9:00").hour(DATE_SWITCHING_HOUR).minute(0)
  .second(0);
const DATE = MOMENT.clone().subtract(1, "days").format("YYYY-MM-DD");
const LATEST = MOMENT.clone().unix().toString();
const OLDEST = MOMENT.clone().subtract(1, "days").unix().toString();

const fetchChannels = async () => {
  let channels: Array<Channel> = [];
  let nextCursor = undefined;

  while (nextCursor !== "") {
    const urlOptions = [
      ...DEFAULT_CHANNEL_LIST_OPTIONS,
      nextCursor != null ? `cursor=${nextCursor}` : undefined,
    ].filter((v): v is string => v != null).join("&");

    const result = await fetch(
      `https://slack.com/api/conversations.list?${urlOptions}`,
      {
        ...DEFAULT_FETCH_OPTIONS,
      },
    );

    const { channels: fetchChannels, response_metadata: { next_cursor } } =
      (await result.json()) as Conversations;

    channels = [...channels, ...fetchChannels];
    nextCursor = next_cursor;
  }

  return channels;
};

const validMessage = (message: Message) => {
  if (message.bot_id != null) {
    return false;
  }

  if (message.subtype == null || message.subtype === "thread_broadcast") {
    return true;
  }

  return false;
};

const fetchHistory = async (channel: Channel) => {
  const urlOptions = [
    ...DEFAULT_HISTORY_OPTIONS,
    `channel=${channel.id}`,
    `oldest=${OLDEST}`,
    `latest=${LATEST}`,
  ].join("&");

  const result = await fetch(
    `https://slack.com/api/conversations.history?${urlOptions}`,
    {
      ...DEFAULT_FETCH_OPTIONS,
    },
  );

  const data = (await result.json()) as History;
  const messages = data.messages.filter((message) => validMessage(message));

  return {
    messages,
  };
};

const dataToMessageCount = (data: Array<AggregatedData>) => {
  let count = 0;
  for (const v of data) {
    count += v.messages.length;
  }

  return `合計発言数: ${count.toString()}\n\n`;
};

const dataToRanking = (data: Array<AggregatedData>) => {
  const message = data
    .filter((channel) => channel.messages.length !== 0)
    .sort((a, b) => b.messages.length - a.messages.length)
    .slice(0, RANKING_COUNT)
    .map((channel) => `- <#${channel.id}> (${channel.messages.length})`)
    .join("\n");

  return message;
};

const postMessage = async (message: string) => {
  const body = {
    channel: POST_CHANNEL,
    username: USER_NAME,
    icon_emoji: ICON_EMOJI,
    text: message,
  };

  const options = {
    ...DEFAULT_POST_OPTIONS,
    body: JSON.stringify(body),
  };

  return await fetch(`https://slack.com/api/chat.postMessage`, options);
};

const main = async () => {
  const channels = await fetchChannels();
  let data: Array<AggregatedData> = [];

  let i = 1;
  for (const channel of channels) {
    console.log(`fetch [${i}/${channels.length}]: ${channel.name}`);
    const history = await fetchHistory(channel);
    const aggregated: AggregatedData = {
      id: channel.id,
      name: channel.name,
      ...history,
    };

    data = [...data, aggregated];

    await delay(1500);
    i++;
  }

  const header = `== ${DATE} の発言数ランキング ==\n`
  const messageCount = dataToMessageCount(data);
  const ranking = dataToRanking(data);
  const message = `${header}${messageCount}${ranking}`;
  console.log(message);
  postMessage(message);
};

main();
