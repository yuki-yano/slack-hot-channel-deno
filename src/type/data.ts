import type { Message } from "./slack.ts";

export type AggregatedData = {
  id: string;
  name: string;
  messages: Array<Message>;
};

export type Ranking = {
  channel: AggregatedData;
  rank: number;
};

export type RankingDiff = Ranking & {
  diff: number;
};
