import { formatAttachmentFieldValue } from "./index.ts";
import { RankingDiff } from "../type/data.ts";
import { assertEquals } from "https://deno.land/std@0.65.0/testing/asserts.ts";
import {
  RANKING_DOWNTREND_EMOJI,
  RANKING_SIDEWAYTREND_EMOJI,
  RANKING_UPTREND_EMOJI,
} from "../env.ts";

Deno.test("formatAttachmentFieldValue", () => {
  const rankDiffTemplate: RankingDiff = {
    channel: {
      id: "dummy-id",
      name: "dummy-name",
      messages: [
        {
          bot_id: "dummy-bot-id",
          subtype: "dummy-subtype",
        },
      ],
    },
    rank: 1,
    diff: 3,
  };

  // up trend
  assertEquals(
    formatAttachmentFieldValue({
      rankingDiff: rankDiffTemplate,
      sumOfMessages: 10,
    }),
    `1. <#dummy-id> ${RANKING_UPTREND_EMOJI} +3 / 発言数: 1 (10.0%)`,
  );

  // down trend
  assertEquals(
    formatAttachmentFieldValue({
      rankingDiff: { ...rankDiffTemplate, diff: -2 },
      sumOfMessages: 10,
    }),
    `1. <#dummy-id> ${RANKING_DOWNTREND_EMOJI} -2 / 発言数: 1 (10.0%)`,
  );

  // sideways trend
  assertEquals(
    formatAttachmentFieldValue({
      rankingDiff: { ...rankDiffTemplate, diff: 0 },
      sumOfMessages: 10,
    }),
    `1. <#dummy-id> ${RANKING_SIDEWAYTREND_EMOJI} / 発言数: 1 (10.0%)`,
  );
});
