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

function mapSupabaseUserToAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { role?: string };
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    role: (user.user_metadata?.role as string) || "user",
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.id && parsed?.email) {
          setUser(parsed);
        }
      } catch {
        // ignore invalid stored value
      }
    }

    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setLoading(false);
        return;
      }

      const next = mapSupabaseUserToAuthUser(data.user as any);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
      setLoading(false);
    };

    init();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const next = mapSupabaseUserToAuthUser(session.user as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const api = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signup: async ({ email, password }) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required");

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          const next = mapSupabaseUserToAuthUser(data.user as any);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setUser(next);
        }
      },
      login: async ({ email, password }) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required");

<<<<<<< Updated upstream
        const hashed = await hashPassword(trimmedPassword);
=======
        // Hardcoded admin: no Supabase, redirect handled by Login page
        if (
          trimmedEmail === HARDCODED_ADMIN.email.toLowerCase() &&
          trimmedPassword === HARDCODED_ADMIN.password
        ) {
          const next: AuthUser = {
            id: "admin",
            email: HARDCODED_ADMIN.email,
            role: HARDCODED_ADMIN.role,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setUser(next);
          return next;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

        if (error || !data?.user) throw new Error("Invalid email or password");

        const next = mapSupabaseUserToAuthUser(data.user as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        supabase.auth.signOut().catch((err) => {
          console.error("Failed to sign out from Supabase", err);
        });
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

