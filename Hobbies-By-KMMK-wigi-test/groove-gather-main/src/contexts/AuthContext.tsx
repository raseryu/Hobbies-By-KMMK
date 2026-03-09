import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signup: (params: { email: string; password: string }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "kmmk_auth_user_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  if (!window.crypto?.subtle) throw new Error("Web Crypto API not available");
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setLoading(false);
  }, []);

  const api = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signup: async ({ email, password }) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required");

        const hashed = await hashPassword(trimmedPassword);

        const { data, error } = await supabase
          .from("users")
          .insert({ email: trimmedEmail, password: hashed, role: "user" })
          .select("id, email, role")
          .single();

        if (error || !data) throw new Error("Failed to create account");

        const next: AuthUser = { id: data.id, email: data.email, role: data.role || "user" };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      login: async ({ email, password }) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required");

        const hashed = await hashPassword(trimmedPassword);

        const { data, error } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("email", trimmedEmail)
          .eq("password", hashed)
          .maybeSingle();

        if (error) throw new Error("Failed to sign in");
        if (!data) throw new Error("Invalid email or password");

        const next: AuthUser = { id: data.id, email: data.email, role: data.role || "user" };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

