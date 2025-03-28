export type Conversation = {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  unread?: boolean;
  queryCount?: number;
};
