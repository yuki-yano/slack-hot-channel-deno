export type Conversations = {
  channels: Array<Channel>;
  response_metadata: {
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
