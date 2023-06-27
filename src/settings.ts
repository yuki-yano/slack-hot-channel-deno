type SettingsJson = {
  post_channel?: string;
  ranking_count?: number;
  user_name?: string;
  icon_emoji?: string;
  color?: string;
  date_switching_hour?: number;
  ranking_sidewaytrend_emoji?: string;
  ranking_uptrend_emoji?: string;
  ranking_downtrend_emoji?: string;
  exclude_channels?: Array<string>;
};

export type Settings = {
  post_channel: string;
  ranking_count: number;
  user_name: string;
  icon_emoji: string;
  color: string;
  date_switching_hour: number;
  ranking_sidewaytrend_emoji: string;
  ranking_uptrend_emoji: string;
  ranking_downtrend_emoji: string;
  exclude_channels: Array<RegExp>;
};

const DEFAULT_RANKING_COUNT = 20;
const DEFAULT_USER_NAME = "hot-channels";
const DEFAULT_ICON_EMOJI = ":tada:";
const DEFAULT_COLOR = "#95B88F";
const DEFAULT_DATE_SWITCHING_HOUR = 4;
const DEFAULT_RANKING_SIDEWAY_TREND_EMOJI = ":arrow_right:";
const DEFAULT_RANKING_UP_TREND_EMOJI = ":arrow_up:";
const DEFAULT_RANKING_DOWN_TREND_EMOJI = ":arrow_down:";
const DEFAULT_EXCLUDE_CHANNELS: Array<RegExp> = [];

export const getDefaultSettings = (): Settings => ({
  post_channel: "",
  ranking_count: DEFAULT_RANKING_COUNT,
  user_name: DEFAULT_USER_NAME,
  icon_emoji: DEFAULT_ICON_EMOJI,
  color: DEFAULT_COLOR,
  date_switching_hour: DEFAULT_DATE_SWITCHING_HOUR,
  ranking_sidewaytrend_emoji: DEFAULT_RANKING_SIDEWAY_TREND_EMOJI,
  ranking_uptrend_emoji: DEFAULT_RANKING_UP_TREND_EMOJI,
  ranking_downtrend_emoji: DEFAULT_RANKING_DOWN_TREND_EMOJI,
  exclude_channels: DEFAULT_EXCLUDE_CHANNELS,
});

export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await import(`${Deno.cwd()}/settings.json`, {
      assert: { type: "json" },
    });
    const json = data.default as SettingsJson;

    if (!json.post_channel) {
      throw new Error("Post channel is not defined in settings");
    }

    const settings: Settings = {
      ...getDefaultSettings(),
      post_channel: json.post_channel,
      exclude_channels: (json.exclude_channels ?? []).map((exclude) =>
        new RegExp(exclude)
      ) ?? DEFAULT_EXCLUDE_CHANNELS,
    };

    return settings;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
