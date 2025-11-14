"use client";

import { createContext, useCallback, useMemo, useState, useContext } from "react";
import type { AuthResponse, AuthTokens, PermissionName, UserProfile } from "@/types/rbac";
import { post } from "@/lib/api";
import { useToast } from "./ToastContext";

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: PermissionName | string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "cpos.auth";

function persistState(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ tokens: state.tokens, user: state.user })
  );
}

function loadState(): Pick<AuthState, "tokens" | "user"> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse auth state", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<AuthState>(() => {
    const saved = loadState();
    return {
      user: saved?.user ?? null,
      tokens: saved?.tokens ?? null,
      isLoading: false,
    };
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await post<AuthResponse, { identifier: string; password: string }>(
        "/api/auth/login",
        { identifier: email, password }
      );

      setState({
        user: response.user,
        tokens: response.tokens,
        isLoading: false,
      });
      persistState({ user: response.user, tokens: response.tokens, isLoading: false });
      toast.success("Successfully logged in!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      throw error; // Re-throw so components can handle it if needed
    }
  }, [toast]);

  const logout = useCallback(async () => {
    if (state.tokens?.refreshToken) {
      try {
        await post("/api/auth/logout", { refreshToken: state.tokens.refreshToken }, {
          accessToken: state.tokens.accessToken,
        });
      } catch (error) {
        console.warn("Logout failed", error);
      }
    }

    setState({ user: null, tokens: null, isLoading: false });
    persistState({ user: null, tokens: null, isLoading: false });
    toast.success("Successfully logged out!");
  }, [state.tokens, toast]);

  const refresh = useCallback(async () => {
    if (!state.tokens?.refreshToken) return;
    const response = await post<AuthResponse, { refreshToken: string }>(
      "/api/auth/refresh",
      { refreshToken: state.tokens.refreshToken }
    );
    setState({ user: response.user, tokens: response.tokens, isLoading: false });
    persistState({ user: response.user, tokens: response.tokens, isLoading: false });
  }, [state.tokens]);

  const hasRole = useCallback(
    (roleName: string) => Boolean(state.user?.roles.some((role) => role.name === roleName)),
    [state.user]
  );

  const hasPermission = useCallback(
    (permission: PermissionName | string) =>
      Boolean(state.user?.permissions?.includes(permission as PermissionName)),
    [state.user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh, hasRole, hasPermission }),
    [state, login, logout, refresh, hasRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
