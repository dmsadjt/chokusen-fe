export type Workspace = {
  workspaceId: string;
  workspaceName: string;
};

export type Channel = {
  channelId: string;
  channelName: string;
  isPrivate: boolean;
};

export type UnreadCount = {
  channelId: string;
  unreadCount: number;
};

export type ReadReceipt = {
  userId: string;
  username: string;
  readAt: string;
};

export type Message = {
  messageId: string;
  channelId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  sentAt: string;
};
