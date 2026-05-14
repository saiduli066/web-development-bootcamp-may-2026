import { api } from "../lib/axios";
import type { User } from "../types/user";

type AuthResponse = {
  user: User;
  accessToken: string;
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  const { data } = await api.post<AuthResponse>("/api/auth/register", payload);
  return data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const { data } = await api.post<AuthResponse>("/api/auth/login", payload);
  return data;
};

export const refreshSession = async () => {
  const { data } = await api.post<AuthResponse>("/api/auth/refresh");
  return data;
};

export const getMe = async () => {
  const { data } = await api.get<{ user: User }>("/api/auth/me");
  return data.user;
};

export const logoutUser = async () => {
  await api.post("/api/auth/logout");
};
