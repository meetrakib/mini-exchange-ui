const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
const API_V1 = `${API_URL}/api/v1`;
const TOKEN_KEY = "mini_exchange_token";
const USER_ID_KEY = "mini_exchange_user_id";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user_id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, user_id);
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

function authHeaders(): HeadersInit {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail || "Request failed"));
  }
  return res.json();
}

export async function apiPublic<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail || "Request failed"));
  }
  return res.json();
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function getOrderBook(symbol?: string, depth?: number): Promise<OrderBook> {
  const params = new URLSearchParams();
  if (symbol) params.set("symbol", symbol);
  if (depth != null) params.set("depth", String(depth));
  return apiPublic<OrderBook>("/orders/book?" + params.toString());
}

export interface Order {
  id: number;
  user_id: string;
  symbol: string;
  side: string;
  order_type: string;
  price: number | null;
  quantity: number;
  filled_quantity: number;
  status: string;
}

export function placeOrder(data: {
  symbol?: string;
  side: string;
  order_type: string;
  price?: number | null;
  quantity: number;
}): Promise<Order> {
  return api<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ symbol: "BTC-PERP", ...data }),
  });
}

export function cancelOrder(orderId: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>("/orders/" + orderId, { method: "DELETE" });
}

export function listOrders(symbol?: string): Promise<Order[]> {
  const params = symbol ? "?symbol=" + encodeURIComponent(symbol) : "";
  return api<Order[]>("/orders" + params);
}

export interface Position {
  id: number;
  user_id: string;
  symbol: string;
  size: number;
  entry_price: number;
}

export function listPositions(): Promise<Position[]> {
  return api<Position[]>("/positions");
}

export interface Ticker {
  symbol: string;
  last: number;
}

export function getTicker(symbol?: string): Promise<Ticker> {
  const params = symbol ? "?symbol=" + encodeURIComponent(symbol) : "";
  return apiPublic<Ticker>("/ticker" + params);
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

export function signup(email: string, password: string): Promise<TokenResponse> {
  return apiPublic<TokenResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiPublic<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface UserMe {
  user_id: string;
  email: string | null;
}

export function getMe(): Promise<UserMe> {
  return api<UserMe>("/auth/me");
}

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function getKlines(
  symbol?: string,
  interval?: string,
  limit?: number
): Promise<{ symbol: string; interval: string; klines: Kline[] }> {
  const params = new URLSearchParams();
  if (symbol) params.set("symbol", symbol);
  if (interval) params.set("interval", interval);
  if (limit != null) params.set("limit", String(limit));
  return apiPublic<{ symbol: string; interval: string; klines: Kline[] }>("/ticker/klines?" + params.toString());
}
