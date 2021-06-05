import { BOT_TOKEN, TOKEN } from "../env.ts";

export const DEFAULT_FETCH_OPTIONS = {
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
  },
};

export const DEFAULT_POST_OPTIONS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": `Bearer ${BOT_TOKEN}`,
  },
};

export const DEFAULT_CHANNEL_LIST_OPTIONS = [
  "limit=1000",
  "exclude_archived=true",
];

export const DEFAULT_HISTORY_OPTIONS = [
  "limit=1000",
];
