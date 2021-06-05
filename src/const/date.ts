import { moment } from "../deps.ts";
import { DATE_SWITCHING_HOUR } from "../env.ts";

export const MOMENT = moment().utcOffset("+9:00").hour(DATE_SWITCHING_HOUR)
  .minute(0)
  .second(0);
export const DATE = MOMENT.clone().subtract(1, "days").format("YYYY-MM-DD");
export const TODAY_LATEST = MOMENT.clone().unix().toString();
export const TODAY_OLDEST = MOMENT.clone().subtract(1, "days").unix()
  .toString();
export const YESTERDAY_LATEST = MOMENT.clone().subtract(1, "days").unix()
  .toString();
export const YESTERDAY_OLDEST = MOMENT.clone().subtract(2, "days").unix()
  .toString();
