import {
  calcRankingDiff,
  calcRankingOfDay,
  countSumOfMessages,
  dataToAttachmentFields,
} from "./calc/index.ts";
import {
  DATE,
  TODAY_LATEST,
  TODAY_OLDEST,
  YESTERDAY_LATEST,
  YESTERDAY_OLDEST,
} from "./const/date.ts";
import { getSettings, Settings } from "./settings.ts";
import { fetchChannels, getData, postMessage } from "./slack/index.ts";
import type { Ranking, RankingDiff } from "./type/data.ts";
import { Channel } from "./type/slack.ts";

const getChannels = async (settings: Settings): Promise<Array<Channel>> => {
  const channels = await fetchChannels();

  if (settings.exclude_channels) {
    return channels.filter((channel) =>
      !settings.exclude_channels.some((exclude) => exclude.test(channel.name))
    );
  } else if (settings.include_channels) {
    return channels.filter((channel) =>
      settings.include_channels.some((include) => include.test(channel.name))
    );
  } else {
    return channels;
  }
};

const main = async (): Promise<void> => {
  const settings = await getSettings();

  const channels = await getChannels(settings);

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
    settings,
  );
  console.log({ attachmentTitle, attachmentText, attachmentFields });
  postMessage({ attachmentTitle, attachmentText, attachmentFields }, settings);
};

main();
