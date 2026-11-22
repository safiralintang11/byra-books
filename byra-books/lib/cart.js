'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { hargaAktif } from './format';

const Ctx = createContext(null);

const load = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? d;
  } catch {
    return d;
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [wish, setWish] = useState([]);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(load('byra_cart', []));
    setWish(load('byra_wish', []));
    setHistory(load('byra_orders', []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('byra_cart', JSON.stringify(items)); }, [items, ready]);
  useEffect(() => { if (ready) localStorage.setItem('byra_wish', JSON.stringify(wish)); }, [wish, ready]);
  useEffect(() => { if (ready) localStorage.setItem('byra_orders', JSON.stringify(history)); }, [history, ready]);

  const add = (b, qty = 1) =>
    setItems((prev) => {
      const f = prev.find((i) => i.id === b.id);
      if (f) return prev.map((i) => (i.id === b.id ? { ...i, qty: i.qty + qty } : i));
      return [
        ...prev,
        {
          id: b.id, title: b.title, author: b.author, price: hargaAktif(b),
          cover_url: b.cover_url, status: b.status, qty,
        },
      ];
    });
  const setQty = (id, qty) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const toggleWish = (id) => setWish((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const addHistory = (code, phone) =>
    setHistory((p) => [{ code, phone, at: new Date().toISOString() }, ...p.filter((h) => h.code !== code)].slice(0, 30));

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <Ctx.Provider
      value={{ items, wish, history, add, setQty, remove, clear, toggleWish, addHistory, count, subtotal, ready }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
