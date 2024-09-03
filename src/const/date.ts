import moment from "npm:moment@2.29.1";
import { getDefaultSettings, getSettings } from "../settings.ts";

const getMoment = async () => {
  try {
    const { date_switching_hour } = await getSettings();
    return moment().utcOffset("+9:00").hour(date_switching_hour)
      .minute(0)
      .second(0);
  } catch (_) {
    return moment().utcOffset("+9:00").hour(
      getDefaultSettings().date_switching_hour,
    )
      .minute(0)
      .second(0);
  }
};

export const DATE = (await getMoment()).clone().subtract(1, "days").format(
  "YYYY-MM-DD",
);
export const TODAY_LATEST = (await getMoment()).clone().unix().toString();
export const TODAY_OLDEST = (await getMoment()).clone().subtract(1, "days")
  .unix()
  .toString();
export const YESTERDAY_LATEST = (await getMoment()).clone().subtract(1, "days")
  .unix()
  .toString();
export const YESTERDAY_OLDEST = (await getMoment()).clone().subtract(2, "days")
  .unix()
  .toString();
