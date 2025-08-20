import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { fetchCustomerMenu, submitOrder, fetchTableNumberByToken } from "../api";

/** Lokaler Fallback-Typ; stört nicht, wenn du schon types.ts hast. */
type MenuItem = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  is_available?: boolean | number;
  image_url?: string | null;
};

type Cart = Record<number, number>; // menu_item_id -> quantity

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";
}

export default function CustomerOrder() {
  const { slug = "" } = useParams();
  const [sp] = useSearchParams();

  // Token-first: ?t=TABLE_TOKEN  | Fallback: ?table=12 (Nummer)
  const tableToken = (sp.get("t") || sp.get("token") || "").trim();
  const tableNumber = (sp.get("table") || sp.get("tn") || "").trim();

  const storageKey = useMemo(
    () => `sqrcart:${slug}:${tableToken || `tn:${tableNumber || "?"}`}`,
    [slug, tableToken, tableNumber]
  );

  // UI-State
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvedTableNumber, setResolvedTableNumber] = useState<string>('');

  // Cart + Kundendaten
  const [cart, setCart] = useState<Cart>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Cart) : {};
    } catch {
      return {};
    }
  });
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ order_number: string; total: number } | null>(null);

  // Menü laden
  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const j = await fetchCustomerMenu(slug);
        // Backend liefert { ok:true, data:{ items:[...] } } oder { ok:true, items:[...] }
        const items: MenuItem[] =
          (Array.isArray(j?.data?.items) && j.data.items) ||
          (Array.isArray(j?.items) && j.items) ||
          [];
        const onlyAvail = items.filter(
          (it) => (Number(it.is_available) === 1) || it.is_available === true || typeof it.is_available === "undefined"
        );
        if (!cancel) setMenu(onlyAvail);
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Menü konnte nicht geladen werden");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [slug]);

  //Token Check
  useEffect(() => {
  let cancel = false;
  async function resolveNumber() {
    if (!tableToken) return;     // ohne Token nichts tun
    try {
      const j = await fetchTableNumberByToken(slug, tableToken);
      const tn = j?.data?.table_number ?? j?.table_number ?? '';
      if (!cancel) setResolvedTableNumber(String(tn));
    } catch {
      if (!cancel) setResolvedTableNumber(''); // Token ungültig -> leer lassen
    }
  }
  resolveNumber();
  return () => { cancel = true; };
}, [slug, tableToken]);

  // Warenkorb persistieren
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {/* ignore */}
  }, [cart, storageKey]);

  // Derived
  const itemsInCart = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const item = menu.find((m) => m.id === Number(id));
          if (!item || qty <= 0) return null;
          return { item, qty };
        })
        .filter(Boolean) as { item: MenuItem; qty: number }[],
    [cart, menu]
  );

  const total = useMemo(
    () => itemsInCart.reduce((sum, row) => sum + row.item.price * row.qty, 0),
    [itemsInCart]
  );

  function add(id: number) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function sub(id: number) {
    setCart((c) => {
      const n = (c[id] || 0) - 1;
      const cp = { ...c };
      if (n <= 0) delete cp[id];
      else cp[id] = n;
      return cp;
    });
  }
  function clearCart() {
    setCart({});
  }

  async function onSubmit() {
    if (!tableToken && !tableNumber) {
      alert("Ungültiger Tischauswahl-Link. Bitte QR-Code erneut scannen.");
      return;
    }
    if (itemsInCart.length === 0) {
      alert("Bitte wähle mindestens einen Artikel.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        table_token: tableToken || undefined,
        table_number: !tableToken ? tableNumber : undefined, // Fallback nur wenn kein Token
        items: itemsInCart.map((r) => ({
          menu_item_id: r.item.id,
          quantity: r.qty,
          name: r.item.name, // rein informativ
        })),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        customer_notes: customerNotes || undefined,
      };

      const j = await submitOrder(slug, payload);
      if (j?.ok === false) throw new Error(j?.error || "Bestellung fehlgeschlagen");

      setSuccess({ order_number: j?.data?.order_number || j?.order_number, total: j?.data?.total ?? j?.total ?? total });
      clearCart();
    } catch (e: any) {
      setError(e?.message || "Bestellung konnte nicht übermittelt werden");
    } finally {
      setSubmitting(false);
    }
  }

  // Fehlender Token/Nummer Hinweis direkt oben
  if (!tableToken && !tableNumber && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow p-8 space-y-4 text-center">
          <h1 className="text-xl font-semibold">Ungültiger Link</h1>
          <p className="text-slate-600">Es wurde weder ein Tisch-Token noch eine Tischnummer übergeben.</p>
          <p className="text-xs text-slate-400">Bitte scanne den QR-Code am Tisch erneut.</p>
          <Link className="inline-block mt-2 text-indigo-600 hover:underline" to="/">Zur Startseite</Link>
        </div>
      </div>
    );
  }

  // Erfolgsscreen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-emerald-50">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow p-8 space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Bestellung gesendet</h1>
          <p className="text-slate-600">Bestellnummer: <span className="font-mono">{success.order_number}</span></p>
          <p className="text-slate-600">Gesamtsumme: <strong>{money(success.total)}</strong></p>
          <p className="text-slate-500 text-sm">Du erhältst eine Benachrichtigung, sobald deine Bestellung unterwegs ist.</p>
          <button onClick={() => setSuccess(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white">Weitere Artikel bestellen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Speisekarte</h1>
            <p className="text-xs text-slate-500">
              Tisch&nbsp;
              <span className="font-mono">
                {resolvedTableNumber || tableNumber || (tableToken ? "per Token" : "–")}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Zwischensumme</div>
            <div className="text-lg font-bold">{money(total)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Fehler/Info */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>
        )}

        {/* Menü */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Lade Menü…</div>
        ) : (
          <>
            {menu.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl bg-white">
                <p className="text-slate-600">Keine Artikel verfügbar.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {menu.map((it) => (
                  <article key={it.id} className="bg-white rounded-2xl border p-5 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{it.name}</h3>
                      {it.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-3">{it.description}</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="font-bold">{money(it.price)}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sub(it.id)}
                          className="w-9 h-9 rounded-full border bg-white hover:bg-slate-50 disabled:opacity-40"
                          disabled={!cart[it.id]}
                          aria-label="Minus"
                        >
                          −
                        </button>
                        <div className="w-6 text-center font-mono">{cart[it.id] || 0}</div>
                        <button
                          onClick={() => add(it.id)}
                          className="w-9 h-9 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                          aria-label="Plus"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* Warenkorb */}
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Warenkorb</h2>
          {itemsInCart.length === 0 ? (
            <p className="text-slate-500 text-sm">Noch keine Artikel ausgewählt.</p>
          ) : (
            <ul className="divide-y">
              {itemsInCart.map(({ item, qty }) => (
                <li key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">{qty} × {money(item.price)}</div>
                  </div>
                  <div className="font-semibold">{money(item.price * qty)}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Kundendaten */}
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="Telefon (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <textarea
            className="w-full border rounded-xl px-3 py-2"
            rows={3}
            placeholder="Anmerkungen (z. B. Allergien, Sonderwünsche)"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="text-slate-600">
              Gesamt: <span className="font-bold text-slate-900">{money(total)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="px-4 py-2 rounded-xl border hover:bg-slate-50"
                disabled={itemsInCart.length === 0 || submitting}
              >
                Leeren
              </button>
              <button
                onClick={onSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={itemsInCart.length === 0 || submitting}
              >
                {submitting ? "Sende…" : "Bestellen"}
              </button>
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-slate-400">
          Powered by SmartQR
        </div>
      </main>
    </div>
  );
}
