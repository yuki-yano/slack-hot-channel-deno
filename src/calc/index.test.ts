import { formatAttachmentFieldValue } from "./index.ts";
import { RankingDiff } from "../type/data.ts";
import { assertEquals } from "https://deno.land/std@0.65.0/testing/asserts.ts";
import { getDefaultSettings } from "../settings.ts";

Deno.test("formatAttachmentFieldValue", () => {
  const settings = getDefaultSettings();
  const {
    ranking_sidewaytrend_emoji,
    ranking_uptrend_emoji,
    ranking_downtrend_emoji,
  } = settings;

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
    }, settings),
    `1. <#dummy-id> ${ranking_uptrend_emoji} +3 / 発言数: 1 (10.0%)`,
  );

  // down trend
  assertEquals(
    formatAttachmentFieldValue({
      rankingDiff: { ...rankDiffTemplate, diff: -2 },
      sumOfMessages: 10,
    }, settings),
    `1. <#dummy-id> ${ranking_downtrend_emoji} -2 / 発言数: 1 (10.0%)`,
  );

  // sideways trend
  assertEquals(
    formatAttachmentFieldValue({
      rankingDiff: { ...rankDiffTemplate, diff: 0 },
      sumOfMessages: 10,
    }, settings),
    `1. <#dummy-id> ${ranking_sidewaytrend_emoji} / 発言数: 1 (10.0%)`,
  );
});
