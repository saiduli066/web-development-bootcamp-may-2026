import { create } from "zustand";
import type { Attachment } from "../types/attachment";

type UploadItem = {
  id: string;
  filename: string;
  progress: number;
};

type MediaState = {
  uploads: UploadItem[];
  sharedMedia: Attachment[];
  setUploads: (uploads: UploadItem[]) => void;
  updateUpload: (id: string, progress: number) => void;
  setSharedMedia: (items: Attachment[]) => void;
};

export const useMediaStore = create<MediaState>((set, get) => ({
  uploads: [],
  sharedMedia: [],
  setUploads: (uploads) => set({ uploads }),
  updateUpload: (id, progress) => {
    const uploads = get().uploads.map((item) =>
      item.id === id ? { ...item, progress } : item,
    );
    set({ uploads });
  },
  setSharedMedia: (items) => set({ sharedMedia: items }),
}));
