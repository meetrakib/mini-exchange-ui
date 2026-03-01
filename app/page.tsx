"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearStoredAuth,
  getKlines,
  getOrderBook,
  getTicker,
  getStoredToken,
  listOrders,
  listPositions,
  placeOrder,
  type Order,
  type OrderBook,
  type Position,
  type Ticker,
} from "@/lib/api";
import Link from "next/link";

const USER_ID_KEY = "mini_exchange_user_id";
const SYMBOL = "BTC-PERP";

function PriceChart({ klines }: { klines: { time: number; close: number }[] }) {
  if (klines.length === 0) return <p className="text-sm text-muted-foreground p-4">Loading chart…</p>;

  const prices = klines.map((k) => k.close);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const padding = { top: 8, right: 8, bottom: 24, left: 48 };
  const w = 400;
  const h = 200;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const points = prices
    .map((p, i) => {
      const x = padding.left + (i / (prices.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((p - minP) / range) * chartH;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padding.left},${padding.top + chartH} ${points} ${padding.left + chartW},${padding.top + chartH}`;

  const labels = klines
    .filter((_, i) => i % Math.max(1, Math.floor(klines.length / 6)) === 0)
    .map((k) => new Date(k.time).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }));

  return (
    <div className="h-64 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="min-w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#priceGradient)"
          points={areaPoints}
        />
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          points={points}
        />
        {labels.map((label, i) => {
          const idx = Math.floor((i / (labels.length - 1 || 1)) * (klines.length - 1));
          const x = padding.left + (idx / (klines.length - 1 || 1)) * chartW;
          return (
            <text
              key={i}
              x={x}
              y={h - 4}
              className="fill-muted-foreground"
              fontSize="10"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
        <text x={8} y={padding.top + 10} fontSize="10" className="fill-muted-foreground">
          {minP.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>
        <text x={8} y={padding.top + chartH - 4} fontSize="10" className="fill-muted-foreground">
          {maxP.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>
      </svg>
    </div>
  );
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [book, setBook] = useState<OrderBook | null>(null);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [klines, setKlines] = useState<{ time: number; close: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getStoredToken();
    const uid = localStorage.getItem(USER_ID_KEY);
    setUserId(token && uid ? uid : null);
    setAuthChecked(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const [b, t, k] = await Promise.all([
        getOrderBook(SYMBOL),
        getTicker(SYMBOL),
        getKlines(SYMBOL, "1h", 24),
      ]);
      setBook(b);
      setTicker(t);
      setKlines(k.klines.map((x) => ({ time: x.time, close: x.close })));
    } catch {
      setBook(null);
      setTicker(null);
      setKlines([]);
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      const [o, p] = await Promise.all([listOrders(), listPositions()]);
      setOrders(o);
      setPositions(p);
    } catch {
      setOrders([]);
      setPositions([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (userId) loadUser();
    else {
      setOrders([]);
      setPositions([]);
    }
  }, [userId, loadUser]);

  function handleLogout() {
    clearStoredAuth();
    setUserId(null);
    setOrders([]);
    setPositions([]);
  }

  async function handlePlace(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!userId) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Invalid quantity");
      return;
    }
    try {
      await placeOrder({
        symbol: SYMBOL,
        side,
        order_type: orderType,
        price: orderType === "limit" && price ? parseFloat(price) : undefined,
        quantity: qty,
      });
      setSuccess("Order placed.");
      setQuantity("");
      setPrice("");
      load();
      loadUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (userId === null) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm text-center">
          <h1 className="text-xl font-semibold tracking-tight">Mini Exchange</h1>
          <p className="text-muted-foreground text-sm mt-1">Paper trading with real BTC price (Binance).</p>
          <p className="text-muted-foreground text-sm mt-4">Log in or sign up to trade.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mini Exchange</h1>
            <p className="text-muted-foreground text-sm mt-1">Paper trading · Real BTC price (Binance)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Account</span>
            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{userId.slice(0, 8)}…</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <h2 className="text-lg font-medium">BTC-PERP · Live price (Binance)</h2>
          <div className="mt-2">
            <PriceChart klines={klines} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <h2 className="text-lg font-medium">Order book</h2>
            {ticker && (
              <p className="text-sm text-muted-foreground mt-1">Last: {ticker.last.toLocaleString()}</p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground">
              <span>Price</span>
              <span className="text-right">Bid</span>
              <span className="text-right">Ask</span>
            </div>
            <div className="mt-1 max-h-64 overflow-y-auto">
              {book ? (
                <>
                  {book.asks.slice(0, 10).reverse().map((a, i) => (
                    <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 text-sm text-red-600">
                      <span>{a.price.toLocaleString()}</span>
                      <span className="text-right">—</span>
                      <span className="text-right">{a.quantity}</span>
                    </div>
                  ))}
                  {book.bids.slice(0, 10).map((b, i) => (
                    <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 text-sm text-green-600">
                      <span>{b.price.toLocaleString()}</span>
                      <span className="text-right">{b.quantity}</span>
                      <span className="text-right">—</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <h2 className="text-lg font-medium">Place order</h2>
            <form onSubmit={handlePlace} className="mt-3 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSide("buy")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${side === "buy" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide("sell")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${side === "sell" ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  Sell
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("limit")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm ${orderType === "limit" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("market")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm ${orderType === "market" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  Market
                </button>
              </div>
              {orderType === "limit" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <button
                type="submit"
                className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white ${side === "buy" ? "bg-green-600 hover:opacity-90" : "bg-red-600 hover:opacity-90"}`}
              >
                {side === "buy" ? "Buy" : "Sell"} {SYMBOL}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background overflow-hidden">
            <h2 className="text-lg font-medium p-4 border-b border-border">My orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Side</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Price</th>
                    <th className="text-left p-3 font-medium">Qty</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-3 text-muted-foreground">No orders yet.</td></tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="border-b border-border">
                        <td className={`p-3 ${o.side === "buy" ? "text-green-600" : "text-red-600"}`}>{o.side}</td>
                        <td className="p-3">{o.order_type}</td>
                        <td className="p-3">{o.price != null ? o.price.toLocaleString() : "MKT"}</td>
                        <td className="p-3">{o.quantity}</td>
                        <td className="p-3">{o.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background overflow-hidden">
            <h2 className="text-lg font-medium p-4 border-b border-border">My positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Symbol</th>
                    <th className="text-left p-3 font-medium">Size</th>
                    <th className="text-left p-3 font-medium">Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr><td colSpan={3} className="p-3 text-muted-foreground">No positions.</td></tr>
                  ) : (
                    positions.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="p-3">{p.symbol}</td>
                        <td className={`p-3 ${p.size > 0 ? "text-green-600" : "text-red-600"}`}>{p.size}</td>
                        <td className="p-3">{p.entry_price.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
