export const TOKEN = Deno.env.get("TOKEN");
export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? TOKEN;
export const POST_CHANNEL = Deno.env.get("POST_CHANNEL");

export const RANKING_COUNT = Number(Deno.env.get("RANKING_COUNT") ?? "20");
export const USER_NAME = Deno.env.get("USER_NAME") ?? "hot-channels";
export const ICON_EMOJI = Deno.env.get("ICON_EMOJI") ?? ":tada:";
export const COLOR = Deno.env.get("COLOR") ?? "#95B88F";
export const DATE_SWITCHING_HOUR = Number(
  Deno.env.get("DATE_SWITCHING_HOUR") ?? "4",
);

if (TOKEN == null || BOT_TOKEN == null || POST_CHANNEL == null) {
  console.error("Environment variable is not set");

  Deno.exit(1);
}
