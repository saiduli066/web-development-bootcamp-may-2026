export type Attachment = {
  _id: string;
  type: "image" | "video" | "file" | "audio";
  url: string;
  publicId: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  duration?: number | null;
};
