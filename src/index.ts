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

type AttachmentField = {
  title?: string;
  value?: string;
  short?: boolean;
};

type Ranking = {
  channel: AggregatedData;
  rank: number;
};

type RankingDiff = Ranking & {
  diff: number;
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
const COLOR = Deno.env.get("COLOR") ?? "#95B88F";

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
const TODAY_LATEST = MOMENT.clone().unix().toString();
const TODAY_OLDEST = MOMENT.clone().subtract(1, "days").unix().toString();
const YESTERDAY_LATEST = MOMENT.clone().subtract(1, "days").unix().toString();
const YESTERDAY_OLDEST = MOMENT.clone().subtract(2, "days").unix().toString();

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

const fetchHistory = async (
  channel: Channel,
  oldest: string,
  latest: string,
) => {
  const urlOptions = [
    ...DEFAULT_HISTORY_OPTIONS,
    `channel=${channel.id}`,
    `oldest=${oldest}`,
    `latest=${latest}`,
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

const countSumOfMessages = (data: Array<AggregatedData>) => {
  let count = 0;
  for (const v of data) {
    count += v.messages.length;
  }

  return count;
};

const calcRatioPercentage = (count: number, sum: number) => {
  const result = (count / sum * 100).toFixed(1);
  return `${result}%`;
};

const calcRankingDiff = (
  { todayRanking, yesterdayRanking }: {
    todayRanking: Array<Ranking>;
    yesterdayRanking: Array<Ranking>;
  },
): Array<RankingDiff> => {
  let data: Array<RankingDiff> = [];

  for (const { channel, rank } of todayRanking) {
    const yesterdayRank = yesterdayRanking.find((
      { channel: yesterdayChannel },
    ) => yesterdayChannel.id === channel.id);

    if (yesterdayRank == null) {
      data = [...data, { channel, rank, diff: 0 }];
    } else {
      data = [...data, { channel, rank, diff: yesterdayRank.rank - rank }];
    }
  }

  return data;
};

const diffToString = (diff: number) => {
  if (diff === 0) {
    return `:arrow_right:`;
  } else if (diff > 0) {
    return `:arrow_up: +${diff}`;
  } else if (diff < 0) {
    return `:arrow_down: ${diff}`;
  }
};

const dataToAttachmentFields = (
  rankingData: Array<RankingDiff>,
  sumOfMessages: number,
): AttachmentField[] => {
  return rankingData
    .filter(({ channel }) => channel.messages.length !== 0)
    .slice(0, RANKING_COUNT)
    .map(({ channel, rank, diff }) => ({
      value: `${rank}. <#${channel.id}> ${
        diffToString(diff)
      } / 発言数: ${channel.messages.length} (${
        calcRatioPercentage(channel.messages.length, sumOfMessages)
      })`,
    }));
};

const postMessage = async ({
  attachmentTitle,
  attachmentText,
  attachmentFields,
}: {
  attachmentTitle: string;
  attachmentText: string;
  attachmentFields: AttachmentField[];
}) => {
  const body = {
    channel: POST_CHANNEL,
    username: USER_NAME,
    icon_emoji: ICON_EMOJI,
    attachments: [
      {
        color: COLOR,
        author_name: "Hot Channels Bot",
        author_link: "https://github.com/yuki-yano/slack-hot-channel-deno",
        title: attachmentTitle,
        text: attachmentText,
        fields: attachmentFields,
      },
    ],
  };

  const options = {
    ...DEFAULT_POST_OPTIONS,
    body: JSON.stringify(body),
  };

  return await fetch(`https://slack.com/api/chat.postMessage`, options);
};

const getData = async (
  { channels, oldest, latest, day }: {
    channels: Array<Channel>;
    oldest: string;
    latest: string;
    day: string;
  },
) => {
  let data: Array<AggregatedData> = [];

  let i = 1;
  for (const channel of channels) {
    console.log(`fetch ${day} [${i}/${channels.length}]: ${channel.name}`);
    const history = await fetchHistory(channel, oldest, latest);
    const aggregated: AggregatedData = {
      id: channel.id,
      name: channel.name,
      ...history,
    };

    data = [...data, aggregated];

    await delay(1500);
    i++;
  }

  return data;
};

const calcRankingOfDay = (data: Array<AggregatedData>): Array<Ranking> => {
  const calcRank = (() => {
    let prevMessageCount: number;
    let prevRank: number;

    return (channel: AggregatedData, i: number): Ranking => {
      const rank = channel.messages.length === prevMessageCount
        ? prevRank
        : i + 1;

      prevMessageCount = channel.messages.length;
      prevRank = rank;

      return {
        channel,
        rank,
      };
    };
  })();

  return data
    .sort((a, b) => b.messages.length - a.messages.length)
    .map(calcRank);
};

const main = async () => {
  const channels = await fetchChannels();

  const todayData = await getData(
    { channels, oldest: TODAY_OLDEST, latest: TODAY_LATEST, day: "today" },
  );
  const yesterdayData = await getData(
    {
      channels,
      oldest: YESTERDAY_OLDEST,
      latest: YESTERDAY_LATEST,
      day: "yesterday",
    },
  );

  const todayRanking: Array<Ranking> = calcRankingOfDay(todayData);
  const yesterdayRanking: Array<Ranking> = calcRankingOfDay(yesterdayData);

  const rankingData: Array<RankingDiff> = calcRankingDiff(
    { yesterdayRanking, todayRanking },
  );

  const sumOfMessages = countSumOfMessages(todayData);
  const attachmentTitle = `${DATE} の発言数ランキング`;
  const attachmentText = `合計発言数: ${sumOfMessages.toString()}`;
  const attachmentFields = dataToAttachmentFields(
    rankingData,
    sumOfMessages,
  );
  console.log({ attachmentTitle, attachmentText, attachmentFields });
  postMessage({ attachmentTitle, attachmentText, attachmentFields });
};

main();
