import { Settings } from "../settings.ts";
import { AggregatedData, Ranking, RankingDiff } from "../type/data.ts";
import { AttachmentField } from "../type/slack.ts";

export const calcRankingDiff = (
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

export const formatAttachmentFieldValue = (
  { rankingDiff: { channel, rank, diff }, sumOfMessages }: {
    rankingDiff: RankingDiff;
    sumOfMessages: number;
  },
  settings: Settings,
) => {
  return `${rank}. <#${channel.id}> ${
    diffToString(diff, settings)
  } / 発言数: ${channel.messages.length} (${
    calcRatioPercentage(channel.messages.length, sumOfMessages)
  })`;
};

export const dataToAttachmentFields = (
  rankingData: Array<RankingDiff>,
  sumOfMessages: number,
  settings: Settings,
): Array<AttachmentField> => {
  return rankingData
    .filter(({ channel }) => channel.messages.length !== 0)
    .map((rankingDiff) => ({
      value: formatAttachmentFieldValue(
        { rankingDiff, sumOfMessages },
        settings,
      ),
    }));
};

export const calcRankingOfDay = (
  data: Array<AggregatedData>,
): Array<Ranking> => {
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

export const countSumOfMessages = (data: Array<AggregatedData>): number => {
  let count = 0;
  for (const v of data) {
    count += v.messages.length;
  }

  return count;
};

const calcRatioPercentage = (count: number, sum: number): string => {
  const result = (count / sum * 100).toFixed(1);
  return `${result}%`;
};

const diffToString = (
  diff: number,
  {
    ranking_sidewaytrend_emoji,
    ranking_uptrend_emoji,
    ranking_downtrend_emoji,
  }: Settings,
): string => {
  if (diff === 0) {
    return ranking_sidewaytrend_emoji;
  } else if (diff > 0) {
    return `${ranking_uptrend_emoji} +${diff}`;
  } else if (diff < 0) {
    return `${ranking_downtrend_emoji} ${diff}`;
  }

  throw new Error("Unexpected diff");
};
