import { api } from "../lib/axios";
import type { User } from "../types/user";

export const updateProfile = async (payload: {
  name?: string;
  bio?: string;
}) => {
  const { data } = await api.patch<{ user: User }>("/users/profile", payload);
  return data.user;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ user: User }>("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.user;
};
