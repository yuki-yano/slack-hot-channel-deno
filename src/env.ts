export const TOKEN = Deno.env.get("TOKEN");
export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? TOKEN;

if (TOKEN == null || BOT_TOKEN == null) {
  console.error("Environment variable is not set");

  Deno.exit(1);
}
