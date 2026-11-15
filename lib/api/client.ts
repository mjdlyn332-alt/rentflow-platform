import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const DJANGO_API_URL = (process.env.EXPO_PUBLIC_DJANGO_API_URL ?? "https://rentflow-api-mu.vercel.app").replace(/\/$/, "");

const ACCESS_KEY = "rentflow.access";
const REFRESH_KEY = "rentflow.refresh";

type Tokens = { access: string; refresh: string };

async function readValue(key: string) {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

async function removeValue(key: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  async get(): Promise<Tokens | null> {
    const [access, refresh] = await Promise.all([readValue(ACCESS_KEY), readValue(REFRESH_KEY)]);
    return access && refresh ? { access, refresh } : null;
  },
  async set(tokens: Tokens) {
    await Promise.all([writeValue(ACCESS_KEY, tokens.access), writeValue(REFRESH_KEY, tokens.refresh)]);
  },
  async clear() {
    await Promise.all([removeValue(ACCESS_KEY), removeValue(REFRESH_KEY)]);
  },
};

export class DjangoApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown) {
    super(typeof payload === "object" && payload && "detail" in payload ? String((payload as { detail: unknown }).detail) : "تعذر تنفيذ الطلب.");
    this.name = "DjangoApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { detail: text }; }
}

async function refreshAccess(refresh: string) {
  const response = await fetch(`${DJANGO_API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const payload = await parseResponse(response);
  if (!response.ok || !payload?.access) throw new DjangoApiError(response.status, payload);
  const next = { access: String(payload.access), refresh: String(payload.refresh ?? refresh) };
  await tokenStore.set(next);
  return next.access;
}

export async function djangoRequest<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const tokens = await tokenStore.get();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);

  const response = await fetch(`${DJANGO_API_URL}${path}`, { ...init, headers });
  const payload = await parseResponse(response);
  if (response.status === 401 && allowRefresh && tokens?.refresh) {
    try {
      const access = await refreshAccess(tokens.refresh);
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Accept", "application/json");
      retryHeaders.set("Authorization", `Bearer ${access}`);
      if (init.body && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
      const retry = await fetch(`${DJANGO_API_URL}${path}`, { ...init, headers: retryHeaders });
      const retryPayload = await parseResponse(retry);
      if (!retry.ok) throw new DjangoApiError(retry.status, retryPayload);
      return retryPayload as T;
    } catch (error) {
      await tokenStore.clear();
      throw error;
    }
  }
  if (!response.ok) throw new DjangoApiError(response.status, payload);
  return payload as T;
}

export type DjangoUser = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "SUPER_ADMIN" | "OWNER" | "STAFF" | "COLLECTOR" | "RENTER" | "UNIT_OWNER";
  organization: string | null;
  can_collect_rent: boolean;
  can_collect_services: boolean;
  can_collect_maintenance: boolean;
  can_create_services: boolean;
};

export type DashboardResponse = {
  organization: { id: string; name: string; currency: string; timezone: string; is_active: boolean };
  role: DjangoUser["role"];
  currency: string;
  metrics: { rent_due: string; properties: number; units: number; occupied: number };
  agreements: Array<Record<string, unknown>>;
  properties: Array<{ id: string; name: string; code: string; address: string; city: string; units_count: number; occupied_count: number }>;
  notifications: Array<{ id: string; title: string; body: string; read_at: string | null; severity: string; created_at: string }>;
};

export const djangoApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${DJANGO_API_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ username, password }) });
    const payload = await parseResponse(response);
    if (!response.ok) throw new DjangoApiError(response.status, payload);
    await tokenStore.set({ access: String(payload.access), refresh: String(payload.refresh) });
    return payload as { access: string; refresh: string; user: DjangoUser };
  },
  me: () => djangoRequest<DjangoUser>("/api/auth/me"),
  dashboard: () => djangoRequest<DashboardResponse>("/api/dashboard"),
  cashboxes: () => djangoRequest<Array<{ id: string; name: string; balance: string; is_active: boolean }>>("/api/cashboxes"),
  vouchers: () => djangoRequest<Array<{ id: string; number: string; kind: string; amount: string; reference: string; status: string; created_at: string }>>("/api/vouchers"),
  logout: () => tokenStore.clear(),
};
