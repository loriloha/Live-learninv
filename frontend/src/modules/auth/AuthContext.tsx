"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../../lib/api-client";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: "teacher" | "student";
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    role: "teacher" | "student";
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "live-learning-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage synchronously to avoid setState in effect
  const getInitialAuth = () => {
    if (typeof window === "undefined") return { user: null, token: null };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { user: parsed.user, token: parsed.token };
      } catch {
        return { user: null, token: null };
      }
    }
    return { user: null, token: null };
  };

  const initialAuth = getInitialAuth();
  const [user, setUser] = useState<AuthUser | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((nextUser: AuthUser, nextToken: string) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await apiFetch<{ user: AuthUser; token: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        }
      );
      persist(response.user, response.token);
    },
    [persist]
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      displayName: string;
      role: "teacher" | "student";
    }) => {
      const response = await apiFetch<{ user: AuthUser; token: string }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      persist(response.user, response.token);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

