type SettingsJson = {
  excludes?: Array<string>;
};

type Settings = {
  excludes?: Array<RegExp>;
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await import(`${Deno.cwd()}/settings.json`, {
      assert: { type: "json" },
    });
    const json = data.default as SettingsJson;

    const settings: Settings = {
      excludes: json.excludes?.map((exclude) => new RegExp(exclude)),
    };

    return settings;
  } catch (_) {
    return {};
  }
};
