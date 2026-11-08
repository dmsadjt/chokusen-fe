export type Workspace = {
  workspaceId: string;
  workspaceName: string;
};

export type Channel = {
  channelId: string;
  channelName: string;
  isPrivate: boolean;
};

export type ChannelMember = {
  userId: string;
  username: string;
};

export type Message = {
  messageId: string;
  channelId: string;
  senderId: string;
  content: string;
  sentAt: string;
};
