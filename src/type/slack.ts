export type Conversations = {
  channels: Array<Channel>;
  // deno-lint-ignore camelcase
  response_metadata: {
    // deno-lint-ignore camelcase
    next_cursor: string;
  };
};

export type Channel = {
  id: string;
  name: string;
};

export type History = {
  messages: Array<Message>;
};

export type Message = {
  // deno-lint-ignore camelcase
  bot_id?: string;
  subtype?: string;
};

export type AttachmentField = {
  title?: string;
  value?: string;
  short?: boolean;
};

export type PostData = {
  attachmentTitle: string;
  attachmentText: string;
  attachmentFields: Array<AttachmentField>;
};
