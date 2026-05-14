import { create } from "zustand";
import type { User } from "../types/user";
import {
  loginUser,
  registerUser,
  refreshSession,
  getMe,
  logoutUser,
} from "../services/authApi";
import { getAccessToken, setAccessToken } from "../lib/tokenStorage";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User, accessToken: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: getAccessToken(),
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },
  updateUser: (user) => set({ user }),
  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  initialize: async () => {
    try {
      const storedToken = getAccessToken();
      if (storedToken) {
        const user = await getMe();
        set({ user, accessToken: storedToken, isAuthenticated: true });
        return;
      }

      const response = await refreshSession();
      setAccessToken(response.accessToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
      });
    } catch (error) {
      setAccessToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
  login: async (payload) => {
    const response = await loginUser(payload);
    setAccessToken(response.accessToken);
    set({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
    });
  },
  register: async (payload) => {
    const response = await registerUser(payload);
    setAccessToken(response.accessToken);
    set({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
    });
  },
  logout: async () => {
    await logoutUser();
    setAccessToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
