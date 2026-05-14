export type UserAvatar = {
  url?: string;
  publicId?: string;
};

export type User = {
  _id: string;
  name: string;
  email?: string;
  avatar?: UserAvatar;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
};
