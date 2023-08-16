import { parse } from "./deps.ts";

type SettingsJson = {
  post_channel: string;
  ranking_count?: number;
  user_name?: string;
  icon_emoji?: string;
  color?: string;
  date_switching_hour?: number;
  ranking_sidewaytrend_emoji?: string;
  ranking_uptrend_emoji?: string;
  ranking_downtrend_emoji?: string;
  exclude_channels?: Array<string>;
  include_channels?: Array<string>;
};

export type ExcludeOnly = {
  exclude_channels: Array<RegExp>;
  include_channels?: never;
};

export type IncludeOnly = {
  exclude_channels?: never;
  include_channels: Array<RegExp>;
};

export type NeitherIncludeNorExclude = {
  exclude_channels?: never;
  include_channels?: never;
};

export type SettingsBase = {
  post_channel: string;
  ranking_count: number;
  user_name: string;
  icon_emoji: string;
  color: string;
  date_switching_hour: number;
  ranking_sidewaytrend_emoji: string;
  ranking_uptrend_emoji: string;
  ranking_downtrend_emoji: string;
};

export type Settings =
  & SettingsBase
  & (ExcludeOnly | IncludeOnly | NeitherIncludeNorExclude);

const DEFAULT_SETTINGS_FILE_NAME = "settings.json";

const DEFAULT_RANKING_COUNT = 20;
const DEFAULT_USER_NAME = "hot-channels";
const DEFAULT_ICON_EMOJI = ":tada:";
const DEFAULT_COLOR = "#95B88F";
const DEFAULT_DATE_SWITCHING_HOUR = 4;
const DEFAULT_RANKING_SIDEWAY_TREND_EMOJI = ":arrow_right:";
const DEFAULT_RANKING_UP_TREND_EMOJI = ":arrow_up:";
const DEFAULT_RANKING_DOWN_TREND_EMOJI = ":arrow_down:";

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
  exclude_channels: undefined,
  include_channels: undefined,
});

const validateSettings = (settings: SettingsJson): void => {
  if (!settings.post_channel) {
    throw new Error("Post channel is not defined in settings");
  }

  if (settings.include_channels && settings.exclude_channels) {
    throw new Error(
      "Both include_channels and exclude_channels are defined in settings",
    );
  }
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const file = parse(Deno.args)["settings"] ?? DEFAULT_SETTINGS_FILE_NAME;
    const data = await import(Deno.realPathSync(file), {
      assert: { type: "json" },
    });
    const json = data.default as SettingsJson;

    validateSettings(json);

    const settings: Settings = {
      ...getDefaultSettings(),
      ...json,
      exclude_channels: json.exclude_channels?.map((exclude) =>
        new RegExp(exclude)
      ),
      include_channels: json.include_channels?.map((include) =>
        new RegExp(include)
      ),
    };
    return settings;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
