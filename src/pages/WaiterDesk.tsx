import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTables, fetchOrdersForTable, updateOrderStatus, markTablePaid, getCurrentTotal, type TableRow } from "../api";

type OrderRow = {
  id: number;
  order_number: string;
  table_id: number;
  table_number?: string | number;
  items: { menu_item_id:number; name?:string; quantity:number; price:number }[];
  total_amount: number;
  order_status: string;   // pending | preparing | completed etc.
  payment_status: string; // unpaid | paid
  created_at?: string;
};

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";
}

export default function WaiterDesk() {
  const { slug = "" } = useParams();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState<number>(0);

  // Tische laden
  useEffect(() => {
    let cancel = false;
    async function loadTables() {
      setLoading(true);
      try {
        const r = await fetchTables(slug);
        if (!cancel) setTables(r.data || []);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    loadTables();
    return () => { cancel = true; }
  }, [slug]);

  // Orders + Summe für gewählten Tisch laden
  async function loadOrdersForSelected() {
    if (!selected) return;
    const r = await fetchOrdersForTable(slug, selected);
    setOrders(r.data || []);
    try {
      const t = await getCurrentTotal(slug, selected);
      const val = t?.data?.total ?? t?.total ?? 0;
      setTotal(Number(val) || 0);
    } catch {
      setTotal(0);
    }
  }

  // Polling alle 10s (einfach, robust)
  useEffect(() => {
    let timer: number | undefined;
    async function tick() { await loadOrdersForSelected(); }
    if (selected) {
      tick();
      timer = window.setInterval(tick, 10000);
    } else {
      setOrders([]);
      setTotal(0);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [slug, selected]);

  const activeOrders = useMemo(
    () => orders.filter(o => o.order_status !== 'completed'),
    [orders]
  );

  async function setStatus(id: number, status: string) {
    setBusy(true);
    try {
      await updateOrderStatus(slug, id, status);
      await loadOrdersForSelected();
    } finally {
      setBusy(false);
    }
  }

  async function closeAndFreeTable() {
    if (!selected) return;
    if (!confirm(`Tisch ${selected}: Bezahlt markieren & freigeben?`)) return;
    setBusy(true);
    try {
      await markTablePaid(slug, selected);
      await loadOrdersForSelected();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold">Kellner · {slug}</h1>
          <div className="text-sm text-slate-600">
            {selected ? <>Tisch <b>{selected}</b> · Summe <b>{money(total)}</b></> : "Tisch wählen"}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid md:grid-cols-12 gap-4">
        {/* Tabellenliste */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="bg-white border rounded-2xl p-3">
            <div className="text-sm font-medium mb-2">Tische</div>
            {loading ? (
              <div className="text-slate-500 text-sm p-3">Lade…</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {tables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.table_number)}
                    className={`h-12 rounded-xl border text-sm font-semibold
                      ${String(selected)===String(t.table_number)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-slate-50'}`}
                  >
                    {t.table_number}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 bg-white border rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Summe</div>
              <div className="font-bold">{money(total)}</div>
            </div>
            <button
              onClick={closeAndFreeTable}
              disabled={!selected || busy}
              className="mt-3 w-full rounded-xl bg-slate-900 text-white py-2 disabled:opacity-50"
            >
              Tisch bezahlt & freigeben
            </button>
          </div>
        </aside>

        {/* Bestellungen */}
        <section className="md:col-span-8 lg:col-span-9">
          <div className="bg-white border rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Aktive Bestellungen {selected ? `• Tisch ${selected}` : ''}
              </div>
              {selected && (
                <button
                  onClick={loadOrdersForSelected}
                  className="text-xs px-3 py-1 rounded-lg border hover:bg-slate-50"
                >
                  Aktualisieren
                </button>
              )}
            </div>

            {!selected ? (
              <div className="text-slate-500 text-sm p-4">Bitte erst einen Tisch wählen.</div>
            ) : activeOrders.length === 0 ? (
              <div className="text-slate-500 text-sm p-4">Keine aktiven Bestellungen.</div>
            ) : (
              <ul className="space-y-3">
                {activeOrders.map(o => (
                  <li key={o.id} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        #{o.order_number} • {o.order_status}
                      </div>
                      <div className="font-bold">{money(o.total_amount)}</div>
                    </div>
                    <ul className="mt-2 text-sm text-slate-700 list-disc pl-5">
                      {o.items.map((it, i) => (
                        <li key={i}>{it.quantity}× {it.name || `#${it.menu_item_id}`}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => setStatus(o.id, 'preparing')}
                        className="px-3 py-1 rounded-lg border hover:bg-slate-50"
                      >
                        In Zubereitung
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setStatus(o.id, 'completed')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
                      >
                        Erledigt
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
