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
  const [lastUpdate, setLastUpdate] = useState(new Date());

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
    setLastUpdate(new Date());
    try {
      const t = await getCurrentTotal(slug, selected);
      const val = t?.data?.total ?? t?.total ?? 0;
      setTotal(Number(val) || 0);
    } catch {
      setTotal(0);
    }
  }

  // Polling alle 8s
  useEffect(() => {
    let timer: number | undefined;
    async function tick() { 
      await loadOrdersForSelected(); 
    }
    if (selected) {
      tick();
      timer = window.setInterval(tick, 8000);
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

  const completedOrders = useMemo(
    () => orders.filter(o => o.order_status === 'completed'),
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'preparing': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Wartend';
      case 'preparing': return 'In Zubereitung';
      case 'completed': return 'Fertig';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/8 to-orange-600/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/6 to-purple-600/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-br from-emerald-500/4 to-teal-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg width="60" height="60" viewBox="0 0 60 60" className="w-full h-full">
            <defs>
              <pattern id="waiterGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waiterGrid)" />
          </svg>
        </div>
      </div>

      {/* Mobile-First Layout */}
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        
        {/* Enhanced Table Selection Sidebar */}
        <aside className="lg:w-96 bg-slate-900/70 backdrop-blur-2xl border-r border-slate-700/50 shadow-2xl">
          <div className="p-6">
            {/* Compact Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white">Kellner-Service</h1>
                  <p className="text-sm text-slate-400 font-medium">{slug}</p>
                </div>
              </div>
              
              {/* Live indicator with enhanced styling */}
              <div className="flex items-center gap-3 text-amber-300 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-3 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <div className="relative">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-semibold">Live Updates aktiv</span>
              </div>
            </div>

            {/* Enhanced Tables Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Tische</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg font-medium">
                    {tables.length} verfügbar
                  </span>
                </div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                  {tables.map(table => {
                    const isSelected = String(selected) === String(table.table_number);
                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelected(table.table_number)}
                        className={`relative h-16 rounded-2xl border-2 transition-all duration-300 font-bold text-lg group overflow-hidden ${
                          isSelected
                            ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/60 text-amber-300 shadow-xl shadow-amber-500/20 scale-105"
                            : "bg-slate-800/40 border-slate-600/40 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/60 hover:text-white hover:scale-105"
                        }`}
                      >
                        {/* Background glow effect */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-500/5 to-transparent"></div>
                        )}
                        
                        {/* Table number */}
                        <span className="relative z-10 drop-shadow-sm">
                          T{table.table_number}
                        </span>
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 overflow-hidden">
          {!selected ? (
            /* Improved No Table Selected State */
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                    <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  {/* Floating elements for visual interest */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500/20 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">Bereit für Service</h3>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  Wähle einen Tisch aus der Seitenleiste, um die aktuellen Bestellungen zu verwalten.
                </p>
                
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Echtzeit-Updates alle 8 Sekunden</span>
                </div>
              </div>
            </div>
          ) : (
            /* Enhanced Table Selected - Orders View */
            <div className="h-full flex flex-col">
              {/* Enhanced Table Header */}
              <header className="p-6 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-2xl border-b border-slate-700/50 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/25">
                        {selected}
                      </div>
                      <h2 className="text-3xl font-bold text-white">Tisch {selected}</h2>
                      <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Aktualisiert: {lastUpdate.toLocaleTimeString("de-DE")}</span>
                      </div>
                      <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full"></div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{activeOrders.length} aktive Bestellungen</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {total > 0 && (
                      <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 px-6 py-4 rounded-2xl border border-slate-600/50 shadow-lg">
                        <div className="text-xs text-slate-400 font-medium mb-1">Gesamtsumme</div>
                        <div className="text-2xl font-bold text-amber-300">{money(total)}</div>
                      </div>
                    )}
                    
                    {completedOrders.length > 0 && (
                      <button
                        onClick={closeAndFreeTable}
                        disabled={busy}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {busy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Wird bearbeitet...</span>
                          </div>
                        ) : (
                          "💰 Bezahlt & Freigeben"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* Enhanced Orders Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/20 rounded-full animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Alles erledigt! ✨</h3>
                    <p className="text-slate-400 text-lg">Tisch {selected} hat aktuell keine offenen Bestellungen.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeOrders.map(order => (
                      <div
                        key={order.id}
                        className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-6 hover:from-slate-800/60 hover:to-slate-700/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                      >
                        {/* Enhanced Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                              <span className="text-amber-300 font-bold">#{order.order_number}</span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white mb-1">
                                Bestellung #{order.order_number}
                              </div>
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border ${getStatusColor(order.order_status)}`}>
                                <div className="w-2 h-2 bg-current rounded-full"></div>
                                {getStatusText(order.order_status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-slate-400 mb-1">Betrag</div>
                              <div className="text-xl font-bold text-white">
                                {money(order.total_amount)}
                              </div>
                            </div>
                            {order.created_at && (
                              <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                                {new Date(order.created_at).toLocaleTimeString("de-DE", { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Order Items */}
                        <div className="space-y-3 mb-6">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 px-4 bg-slate-900/40 rounded-2xl border border-slate-700/30">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                  <span className="text-emerald-300 font-bold text-sm">{item.quantity}×</span>
                                </div>
                                <span className="text-white font-semibold">{item.name || `Item ${item.menu_item_id}`}</span>
                              </div>
                              <span className="text-slate-300 font-bold text-lg">{money(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {order.order_status === 'pending' && (
                            <button
                              onClick={() => setStatus(order.id, 'preparing')}
                              disabled={busy}
                              className="flex-1 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/40 text-blue-300 py-4 px-6 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                            >
                              🍳 In Zubereitung nehmen
                            </button>
                          )}
                          
                          {order.order_status === 'preparing' && (
                            <button
                              onClick={() => setStatus(order.id, 'completed')}
                              disabled={busy}
                              className="flex-1 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 hover:from-emerald-600/30 hover:to-emerald-500/30 border border-emerald-500/40 text-emerald-300 py-4 px-6 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25"
                            >
                              ✅ Als fertig markieren
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Completed Orders Section */}
                {completedOrders.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-300">
                        Fertige Bestellungen ({completedOrders.length})
                      </h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {completedOrders.map(order => (
                        <div
                          key={order.id}
                          className="bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-emerald-300 font-bold text-sm">#{order.order_number}</span>
                              </div>
                              <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✅ Fertig
                              </div>
                            </div>
                            <span className="text-emerald-300 font-bold text-lg">{money(order.total_amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}