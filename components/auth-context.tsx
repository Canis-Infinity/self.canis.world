"use client";
import { createContext, useContext } from "react";
export type User = { name: string; email: string };
export const AuthContext = createContext<{
  user: User | null;
  refreshTick: number;
  expire: () => void;
}>({ user: null, refreshTick: 0, expire: () => {} });
export function useAuth() {
  return useContext(AuthContext);
}
