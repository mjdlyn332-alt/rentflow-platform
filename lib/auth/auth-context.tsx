import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { djangoApi, tokenStore, type DjangoUser } from "@/lib/api/client";

type AuthContextValue = {
  user: DjangoUser | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DjangoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    const current = await tokenStore.get();
    if (!current) {
      setUser(null);
      return;
    }
    try {
      setUser(await djangoApi.me());
      setError(null);
    } catch {
      await tokenStore.clear();
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    async signIn(username, password) {
      setError(null);
      try {
        const result = await djangoApi.login(username.trim(), password);
        setUser(result.user ?? await djangoApi.me());
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذر تسجيل الدخول.";
        setError(message || "بيانات الدخول غير صحيحة.");
        throw err;
      }
    },
    async signOut() {
      await djangoApi.logout();
      setUser(null);
      setError(null);
    },
    refreshUser,
  }), [error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
