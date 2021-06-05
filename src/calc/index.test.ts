import { assertEquals } from "../deps.ts";
import { AggregatedData, Ranking } from "../type/data.ts";
import {
  calcRankingDiff,
  calcRankingOfDay,
  dataToAttachmentFields,
  formatAttachmentFieldValue,
} from "./index.ts";

const createAggregatedData = (
  { name, messageCount }: { name: string; messageCount: number },
): AggregatedData => {
  return {
    id: name,
    name,
    messages: new Array(messageCount).fill({}),
  };
};

const createRanking = (
  { name, messageCount, rank }: {
    name: string;
    messageCount: number;
    rank: number;
  },
): Ranking => {
  return {
    channel: createAggregatedData({ name, messageCount }),
    rank,
  };
};

const todayRanking: Array<Ranking> = [
  createRanking({ name: "a", messageCount: 30, rank: 3 }),
  createRanking({ name: "b", messageCount: 10, rank: 5 }),
  createRanking({ name: "c", messageCount: 50, rank: 1 }),
  createRanking({ name: "d", messageCount: 40, rank: 2 }),
  createRanking({ name: "e", messageCount: 20, rank: 4 }),
];
const yesterdayRanking: Array<Ranking> = [
  createRanking({ name: "a", messageCount: 20, rank: 4 }),
  createRanking({ name: "b", messageCount: 30, rank: 3 }),
  createRanking({ name: "c", messageCount: 10, rank: 5 }),
  createRanking({ name: "d", messageCount: 50, rank: 1 }),
  createRanking({ name: "e", messageCount: 40, rank: 2 }),
];

Deno.test("calcRankingDiff", () => {
  const rankingDiffs = calcRankingDiff({ todayRanking, yesterdayRanking });
  const diffs = [1, -2, 4, -1, -2];

  rankingDiffs.forEach(({ diff }, i) => {
    assertEquals(diff, diffs[i]);
  });
});

Deno.test("dataToAttachmentFields", () => {
  const sumOfMessages = todayRanking.reduce(
    (count, { channel: { messages } }) => {
      return count + messages.length;
    },
    0,
  );
  const rankingDiffs = calcRankingDiff({ todayRanking, yesterdayRanking });

  const attachmentFields = dataToAttachmentFields(rankingDiffs, sumOfMessages);

  attachmentFields.forEach((field, i) => {
    assertEquals(
      field,
      {
        value: formatAttachmentFieldValue({
          rankingDiff: rankingDiffs[i],
          sumOfMessages,
        }),
      },
    );
  });
});

Deno.test("calcRankingOfDay", () => {
  const aggregatedData = [
    createAggregatedData({ name: "a", messageCount: 10 }),
    createAggregatedData({ name: "b", messageCount: 30 }),
    createAggregatedData({ name: "c", messageCount: 20 }),
    createAggregatedData({ name: "d", messageCount: 40 }),
    createAggregatedData({ name: "e", messageCount: 50 }),
  ];
  const rankings = calcRankingOfDay(aggregatedData);

  const testRankings: Array<Ranking> = [
    createRanking({ name: "e", messageCount: 50, rank: 1 }),
    createRanking({ name: "d", messageCount: 40, rank: 2 }),
    createRanking({ name: "b", messageCount: 30, rank: 3 }),
    createRanking({ name: "c", messageCount: 20, rank: 4 }),
    createRanking({ name: "a", messageCount: 10, rank: 5 }),
  ];

  rankings.forEach((ranking, i) => {
    assertEquals(ranking, testRankings[i]);
  });
});
