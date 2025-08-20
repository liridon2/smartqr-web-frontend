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
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tableStats, setTableStats] = useState<Record<string, { total: number; activeOrders: number; completedOrders: number }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Swipe-to-close state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  // Tische laden
  useEffect(() => {
    let cancel = false;
    async function loadTables() {
      setLoading(true);
      try {
        const r = await fetchTables(slug);
        if (!cancel) {
          setTables(r.data || []);
          // Stats für alle Tische laden
          loadAllTableStats(r.data || []);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    loadTables();
    return () => { cancel = true; }
  }, [slug]);

  // Stats für alle Tische laden
  async function loadAllTableStats(tableList: TableRow[]) {
    const stats: Record<string, { total: number; activeOrders: number; completedOrders: number }> = {};
    
    for (const table of tableList) {
      try {
        const [ordersResult, totalResult] = await Promise.all([
          fetchOrdersForTable(slug, table.table_number),
          getCurrentTotal(slug, table.table_number)
        ]);
        
        const tableOrders = ordersResult.data || [];
        const activeOrders = tableOrders.filter(o => o.order_status !== 'completed').length;
        const completedOrders = tableOrders.filter(o => o.order_status === 'completed').length;
        const total = Number(totalResult?.data?.total ?? totalResult?.total ?? 0);
        
        stats[String(table.table_number)] = { total, activeOrders, completedOrders };
      } catch {
        stats[String(table.table_number)] = { total: 0, activeOrders: 0, completedOrders: 0 };
      }
    }
    
    setTableStats(stats);
    setLastUpdate(new Date());
  }

  // Orders für gewählten Tisch laden
  async function loadOrdersForSelectedTable() {
    if (!selectedTable) return;
    const r = await fetchOrdersForTable(slug, selectedTable.table_number);
    setOrders(r.data || []);
  }

  // Polling alle 10s für Stats
  useEffect(() => {
    const timer = setInterval(() => {
      if (tables.length > 0) {
        loadAllTableStats(tables);
      }
    }, 10000);
    
    return () => clearInterval(timer);
  }, [tables, slug]);

  // Polling für geöffnetes Modal
  useEffect(() => {
    let timer: number | undefined;
    if (isModalOpen && selectedTable) {
      const tick = () => loadOrdersForSelectedTable();
      tick();
      timer = window.setInterval(tick, 8000);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [isModalOpen, selectedTable, slug]);

  const activeOrders = useMemo(
    () => orders.filter(o => o.order_status !== 'completed'),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter(o => o.order_status === 'completed'),
    [orders]
  );

  async function openTableModal(table: TableRow) {
    setSelectedTable(table);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedTable(null);
    setOrders([]);
    // Reset swipe state
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDistance(0);
  }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.targetTouches[0].clientY;
    setTouchEnd(currentY);
    
    if (touchStart !== null) {
      const distance = currentY - touchStart;
      // Nur positive Werte (nach unten) für visuelles Feedback
      setSwipeDistance(Math.max(0, distance));
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > 120; // Mind. 120px nach unten
    
    if (isDownSwipe) {
      closeModal();
    } else {
      // Animation zurück zur ursprünglichen Position
      setSwipeDistance(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isModalOpen]);

  async function setStatus(id: number, status: string) {
    setBusy(true);
    try {
      await updateOrderStatus(slug, id, status);
      await loadOrdersForSelectedTable();
      // Stats aktualisieren
      await loadAllTableStats(tables);
    } finally {
      setBusy(false);
    }
  }

  async function closeAndFreeTable() {
    if (!selectedTable) return;
    if (!confirm(`Tisch ${selectedTable.table_number}: Bezahlt markieren & freigeben?`)) return;
    setBusy(true);
    try {
      await markTablePaid(slug, selectedTable.table_number);
      await loadOrdersForSelectedTable();
      await loadAllTableStats(tables);
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

  const getTableStatusColor = (stats: { total: number; activeOrders: number; completedOrders: number }) => {
    if (stats.activeOrders > 0) return 'border-amber-500/60 bg-gradient-to-br from-amber-500/10 to-orange-500/10';
    if (stats.completedOrders > 0) return 'border-emerald-500/60 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10';
    return 'border-slate-600/40 bg-gradient-to-br from-slate-800/40 to-slate-700/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Minimaler Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-white font-semibold">{slug}</span>
        </div>
        
        <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live</span>
        </div>
      </header>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/6 to-orange-600/6 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/4 to-purple-600/6 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Tische Grid */}
      <main className="relative px-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-800/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(table => {
              const stats = tableStats[String(table.table_number)] || { total: 0, activeOrders: 0, completedOrders: 0 };
              const hasActivity = stats.activeOrders > 0 || stats.completedOrders > 0;
              
              return (
                <button
                  key={table.id}
                  onClick={() => openTableModal(table)}
                  className={`relative aspect-square rounded-3xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl group overflow-hidden ${getTableStatusColor(stats)}`}
                >
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
                    {/* Tischnummer */}
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                      T{table.table_number}
                    </div>
                    
                    {/* Status Indikatoren */}
                    {hasActivity ? (
                      <div className="space-y-2 text-center">
                        {stats.activeOrders > 0 && (
                          <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/40">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="text-amber-300 text-xs font-semibold">{stats.activeOrders} aktiv</span>
                          </div>
                        )}
                        
                        {stats.completedOrders > 0 && (
                          <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/40">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-300 text-xs font-semibold">{stats.completedOrders} fertig</span>
                          </div>
                        )}
                        
                        {stats.total > 0 && (
                          <div className="text-white text-sm font-bold bg-slate-900/50 px-2 py-1 rounded-lg">
                            {money(stats.total)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">Frei</div>
                    )}
                  </div>
                  
                  {/* Notification Badge */}
                  {stats.activeOrders > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">{stats.activeOrders}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        
        {/* Update Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 bg-slate-800/50 px-4 py-2 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Letzte Aktualisierung: {lastUpdate.toLocaleTimeString("de-DE")}</span>
          </div>
        </div>
      </main>

      {/* Fullscreen Modal */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl">
          <div 
            className="h-full flex flex-col transition-transform duration-300 ease-out"
            style={{ 
              transform: `translateY(${Math.min(swipeDistance * 0.8, 200)}px)`,
              opacity: 1 - (swipeDistance / 400)
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe Indicator */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full opacity-60"></div>
            </div>
            {/* Modal Header */}
            <header className="p-6 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-2xl border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {selectedTable.table_number}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Tisch {selectedTable.table_number}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{activeOrders.length} aktive • {completedOrders.length} fertige Bestellungen</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeModal}
                  className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Action Bar */}
              {completedOrders.length > 0 && (
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 bg-slate-800/50 px-4 py-3 rounded-2xl">
                    <div className="text-xs text-slate-400 mb-1">Gesamtsumme</div>
                    <div className="text-xl font-bold text-amber-300">
                      {money(orders.reduce((sum, order) => sum + order.total_amount, 0))}
                    </div>
                  </div>
                  
                  <button
                    onClick={closeAndFreeTable}
                    disabled={busy}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-xl disabled:cursor-not-allowed"
                  >
                    {busy ? "..." : "💰 Bezahlt & Freigeben"}
                  </button>
                </div>
              )}
            </header>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeOrders.length === 0 && completedOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Keine Bestellungen</h3>
                  <p className="text-slate-400">Tisch {selectedTable.table_number} hat aktuell keine Bestellungen.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aktive Bestellungen */}
                  {activeOrders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        </div>
                        Aktive Bestellungen ({activeOrders.length})
                      </h3>
                      
                      <div className="space-y-4">
                        {activeOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-5"
                          >
                            {/* Order Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                  <span className="text-amber-300 font-bold text-sm">#{order.order_number}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(order.order_status)}`}>
                                  {getStatusText(order.order_status)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-white">{money(order.total_amount)}</div>
                                {order.created_at && (
                                  <div className="text-xs text-slate-400">
                                    {new Date(order.created_at).toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-900/40 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                      <span className="text-emerald-300 font-bold text-sm">{item.quantity}×</span>
                                    </div>
                                    <span className="text-white font-medium">{item.name || `Item ${item.menu_item_id}`}</span>
                                  </div>
                                  <span className="text-slate-300 font-semibold">{money(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                              {order.order_status === 'pending' && (
                                <button
                                  onClick={() => setStatus(order.id, 'preparing')}
                                  disabled={busy}
                                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 py-3 px-4 rounded-xl font-semibold transition-all duration-200"
                                >
                                  🍳 In Zubereitung
                                </button>
                              )}
                              
                              {order.order_status === 'preparing' && (
                                <button
                                  onClick={() => setStatus(order.id, 'completed')}
                                  disabled={busy}
                                  className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-3 px-4 rounded-xl font-semibold transition-all duration-200"
                                >
                                  ✅ Fertig
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fertige Bestellungen */}
                  {completedOrders.length > 0 && (
                    <div className={activeOrders.length > 0 ? "pt-6 border-t border-slate-700/50" : ""}>
                      <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        Fertige Bestellungen ({completedOrders.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {completedOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                  <span className="text-emerald-300 font-semibold text-sm">#{order.order_number}</span>
                                </div>
                                <span className="text-emerald-300 text-sm font-semibold">✅ Fertig</span>
                              </div>
                              <span className="text-emerald-300 font-bold">{money(order.total_amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}