import {
  DEFAULT_CHANNEL_LIST_OPTIONS,
  DEFAULT_FETCH_OPTIONS,
  DEFAULT_HISTORY_OPTIONS,
  DEFAULT_POST_OPTIONS,
} from "../const/slack.ts";
import { delay } from "jsr:@std/async@1.0.4";
import { Settings } from "../settings.ts";
import type { AggregatedData } from "../type/data.ts";
import type {
  Channel,
  Conversations,
  History,
  Message,
  PostData,
} from "../type/slack.ts";

export const getData = async (
  { channels, oldest, latest, day }: {
    channels: Array<Channel>;
    oldest: string;
    latest: string;
    day: string;
  },
): Promise<Array<AggregatedData>> => {
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

export const fetchChannels = async (): Promise<Array<Channel>> => {
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

    // deno-lint-ignore camelcase
    const { channels: fetchChannels, response_metadata: { next_cursor } } =
      (await result.json()) as Conversations;

    channels = [...channels, ...fetchChannels];
    nextCursor = next_cursor;
  }

  return channels;
};

export const fetchHistory = async (
  channel: Channel,
  oldest: string,
  latest: string,
): Promise<History> => {
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

export const postMessage = async (
  {
    attachmentTitle,
    attachmentText,
    attachmentFields,
  }: PostData,
  { post_channel, user_name, icon_emoji, color, ranking_count }: Settings,
): Promise<void> => {
  const body = {
    channel: post_channel,
    username: user_name,
    // deno-lint-ignore camelcase
    icon_emoji: icon_emoji,
    attachments: [
      {
        color: color,
        author_name: "Hot Channels Bot",
        author_link: "https://github.com/yuki-yano/slack-hot-channel-deno",
        title: attachmentTitle,
        text: attachmentText,
        fields: attachmentFields.slice(0, ranking_count),
      },
    ],
  };

  const options = {
    ...DEFAULT_POST_OPTIONS,
    body: JSON.stringify(body),
  };

  await fetch(`https://slack.com/api/chat.postMessage`, options);
};

const validMessage = (message: Message): boolean => {
  if (message.bot_id != null) {
    return false;
  }

  if (message.subtype == null || message.subtype === "thread_broadcast") {
    return true;
  }

  return false;
};
