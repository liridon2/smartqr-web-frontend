// src/pages/AdminOrders.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchAdminOrders, updateOrderStatus, updatePaymentStatus } from "../api";
import type { OrderListItem } from "../types";

const STATUS_CONFIG = {
  pending: { 
    color: 'from-yellow-500 to-amber-600', 
    bg: 'bg-yellow-600/20', 
    border: 'border-yellow-500/50',
    text: 'text-yellow-300',
    icon: '⏳',
    label: 'Wartend'
  },
  confirmed: { 
    color: 'from-blue-500 to-blue-600', 
    bg: 'bg-blue-600/20', 
    border: 'border-blue-500/50',
    text: 'text-blue-300',
    icon: '✅',
    label: 'Bestätigt'
  },
  preparing: { 
    color: 'from-orange-500 to-red-600', 
    bg: 'bg-orange-600/20', 
    border: 'border-orange-500/50',
    text: 'text-orange-300',
    icon: '👨‍🍳',
    label: 'In Arbeit'
  },
  ready: { 
    color: 'from-purple-500 to-purple-600', 
    bg: 'bg-purple-600/20', 
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    icon: '🔔',
    label: 'Fertig'
  },
  completed: { 
    color: 'from-emerald-500 to-emerald-600', 
    bg: 'bg-emerald-600/20', 
    border: 'border-emerald-500/50',
    text: 'text-emerald-300',
    icon: '✨',
    label: 'Serviert'
  },
  cancelled: { 
    color: 'from-red-500 to-red-600', 
    bg: 'bg-red-600/20', 
    border: 'border-red-500/50',
    text: 'text-red-300',
    icon: '❌',
    label: 'Storniert'
  }
};

const PAYMENT_CONFIG = {
  pending: { color: 'bg-yellow-600', text: 'text-yellow-300', icon: '💳' },
  paid: { color: 'bg-emerald-600', text: 'text-emerald-300', icon: '💰' },
  failed: { color: 'bg-red-600', text: 'text-red-300', icon: '🚫' }
};

// Animated Background for Orders
const OrdersBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Dynamic grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-800/50"></div>
      
      {/* Floating order symbols */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl opacity-5 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 3}s`
          }}
        >
          {['🍽️', '📋', '🔔', '⚡', '💳', '✅', '🚀', '💰'][i]}
        </div>
      ))}
      
      {/* Animated data streams */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse"></div>
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-pulse delay-1000"></div>
    </div>
  );
};

// Real-time Stats Card
const StatsCard = ({ title, value, icon, color, trend, isLoading }: {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: number;
  isLoading?: boolean;
}) => {
  return (
    <div className={`relative ${color} rounded-2xl p-6 overflow-hidden group hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-2xl`}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl">{icon}</div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              trend > 0 ? 'bg-emerald-500/20 text-emerald-300' : trend < 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300'
            }`}>
              {trend > 0 && '↗️'} {trend < 0 && '↘️'} {trend === 0 && '➡️'}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span className="animate-counter">{value}</span>
            )}
          </p>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );
};

// Enhanced Order Card
const OrderCard = ({ order, onStatusUpdate, onPaymentUpdate, isUpdating }: {
  order: OrderListItem;
  onStatusUpdate: (id: number, status: string) => void;
  onPaymentUpdate: (id: number) => void;
  isUpdating: boolean;
}) => {
  const statusConfig = STATUS_CONFIG[order.order_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const paymentConfig = PAYMENT_CONFIG[order.payment_status as keyof typeof PAYMENT_CONFIG] || PAYMENT_CONFIG.pending;
  
  const orderAge = useMemo(() => {
    const now = new Date();
    const orderTime = new Date(order.order_time);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    return diffMinutes;
  }, [order.order_time]);

  const isUrgent = orderAge > 30;
  const isVeryUrgent = orderAge > 60;

  return (
    <div className={`group relative bg-slate-800/50 backdrop-blur-xl border rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden ${
      isVeryUrgent ? 'border-red-500/50 shadow-red-500/20' : 
      isUrgent ? 'border-yellow-500/50 shadow-yellow-500/20' : 
      'border-slate-700/50'
    }`}>
      
      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-red-500/80">
          <div className="absolute -top-8 -right-2 text-white text-xs font-bold transform rotate-45">
            {isVeryUrgent ? '🚨' : '⚠️'}
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              {order.order_number}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-700/50 px-3 py-1 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tisch {order.table_number ?? order.table_id}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="text-slate-400">
              {new Date(order.order_time).toLocaleString("de-DE")}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
              isVeryUrgent ? 'bg-red-500/20 text-red-300' :
              isUrgent ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-slate-600/20 text-slate-400'
            }`}>
              ⏱️ {orderAge} min
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {Number(order.total_amount ?? 0).toFixed(2)} €
          </div>
          <div className="text-slate-400 text-sm">Bestellwert</div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium ${statusConfig.bg} ${statusConfig.border} border backdrop-blur-sm`}>
          <span className="text-lg">{statusConfig.icon}</span>
          <span>Status: {statusConfig.label}</span>
          {order.order_status === 'preparing' && (
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium ${paymentConfig.color}`}>
          <span className="text-lg">{paymentConfig.icon}</span>
          <span>{order.payment_status === 'paid' ? 'Bezahlt' : order.payment_status === 'failed' ? 'Fehler' : 'Ausstehend'}</span>
        </div>
      </div>

      {/* Status Flow */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Workflow</span>
          <span>{Object.keys(STATUS_CONFIG).indexOf(order.order_status) + 1}/6</span>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(STATUS_CONFIG).map(([status, config], index) => {
            const isActive = status === order.order_status;
            const isCompleted = Object.keys(STATUS_CONFIG).indexOf(order.order_status) > index;
            
            return (
              <React.Fragment key={status}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                  isActive ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-110` :
                  isCompleted ? 'bg-emerald-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : config.icon}
                </div>
                {index < Object.keys(STATUS_CONFIG).length - 1 && (
                  <div className={`flex-1 h-1 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Status Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(STATUS_CONFIG).slice(0, 5).map(([status, config]) => (
            <button
              key={status}
              onClick={() => onStatusUpdate(order.id, status)}
              disabled={isUpdating || status === order.order_status}
              className={`${config.bg} hover:${config.bg.replace('/20', '/30')} ${config.border} ${config.text} py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border`}
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </span>
              )}
            </button>
          ))}
          
          <button
            onClick={() => onStatusUpdate(order.id, 'cancelled')}
            disabled={isUpdating}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin mx-auto"></div>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <span>❌</span>
                <span className="hidden sm:inline">Storno</span>
              </span>
            )}
          </button>
        </div>

        {/* Payment Action */}
        <button
          onClick={() => onPaymentUpdate(order.id)}
          disabled={isUpdating || order.payment_status === "paid"}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
        >
          {isUpdating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Wird verarbeitet...
            </span>
          ) : order.payment_status === "paid" ? (
            <span className="flex items-center justify-center gap-2">
              <span>✅</span>
              Bereits bezahlt
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>💰</span>
              Als bezahlt markieren
            </span>
          )}
        </button>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
    </div>
  );
};

// Filter Tab Component
const FilterTab = ({ active, onClick, children, count }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
        active 
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30'
      }`}
    >
      <span className="flex items-center gap-2">
        {children}
        {count !== undefined && count > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            active ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {count}
          </span>
        )}
      </span>
    </button>
  );
};

export default function AdminOrders() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [filter, setFilter] = useState<string>("all");
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const tableFilter = searchParams.get("table");

  async function load() {
    setLoading(true);
    try {
      const res = await fetchAdminOrders(slug) as { ok: boolean; data: OrderListItem[] };
      let orderData = res.data;
      
      // Filter by table if specified
      if (tableFilter) {
        orderData = orderData.filter(o => 
          String(o.table_number) === tableFilter || String(o.table_id) === tableFilter
        );
      }
      
      setOrders(orderData);
      setLastUpdateTime(new Date());
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { load(); }, [slug, adminToken, tableFilter]);

  // Auto-refresh every 8 seconds
  useEffect(() => {
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [slug, adminToken, tableFilter]);

  function saveToken() {
    localStorage.setItem("adminToken", adminToken);
    load();
  }

  async function setStatus(id: number, status: string) {
    setUpdatingOrder(id);
    try {
      await updateOrderStatus(slug, id, status);
      await load();
    } finally {
      setUpdatingOrder(null);
    }
  }

  async function setPaid(id: number) {
    setUpdatingOrder(id);
    try {
      await updatePaymentStatus(slug, id, "paid", "cash");
      await load();
    } finally {
      setUpdatingOrder(null);
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    if (filter === "active") return !["completed", "cancelled"].includes(order.order_status);
    if (filter === "unpaid") return order.payment_status !== "paid";
    if (filter === "urgent") {
      const orderAge = Math.floor((new Date().getTime() - new Date(order.order_time).getTime()) / (1000 * 60));
      return orderAge > 30 && !["completed", "cancelled"].includes(order.order_status);
    }
    return order.order_status === filter;
  });

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOrders = orders.filter(o => new Date(o.order_time) >= today);
    
    return {
      total: orders.length,
      today: todayOrders.length,
      pending: orders.filter(o => o.order_status === "pending").length,
      preparing: orders.filter(o => o.order_status === "preparing").length,
      ready: orders.filter(o => o.order_status === "ready").length,
      unpaid: orders.filter(o => o.payment_status !== "paid").length,
      urgent: orders.filter(o => {
        const orderAge = Math.floor((now.getTime() - new Date(o.order_time).getTime()) / (1000 * 60));
        return orderAge > 30 && !["completed", "cancelled"].includes(o.order_status);
      }).length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) / orders.length : 0
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <OrdersBackground />
      
      {/* Enhanced Header */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-400 to-white bg-clip-text text-transparent">
                  {tableFilter ? `Bestellungen · Tisch ${tableFilter}` : "Bestellungen"}
                </h1>
                <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              <p className="text-slate-400">
                Letztes Update: {lastUpdateTime.toLocaleTimeString("de-DE")} • {stats.today} heute
              </p>
            </div>
            
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
              Auto-Update alle 8s
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Token Input */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-5m5 0v.01M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2h5m-5 0v.01" />
                </svg>
                Admin Authentifizierung
              </label>
              <input
                type="password"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="X-Admin-Token eingeben..."
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <button 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              onClick={saveToken}
            >
              Speichern
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto border-4 border-slate-600/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-blue-400/50 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div>
                <p className="text-slate-300 text-xl font-medium">Lade Bestellungen...</p>
                <p className="text-slate-500 text-sm mt-1">Synchronisiere mit Backend</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatsCard title="Gesamt" value={stats.total} icon="📋" color="bg-slate-800/50" />
              <StatsCard title="Heute" value={stats.today} icon="📅" color="bg-blue-600/20" trend={12} />
              <StatsCard title="Wartend" value={stats.pending} icon="⏳" color="bg-yellow-600/20" />
              <StatsCard title="In Arbeit" value={stats.preparing} icon="👨‍🍳" color="bg-orange-600/20" />
              <StatsCard title="Fertig" value={stats.ready} icon="🔔" color="bg-purple-600/20" />
              <StatsCard title="Dringend" value={stats.urgent} icon="🚨" color="bg-red-600/20" />
            </div>

            {/* Enhanced Filter Tabs */}
            <div className="flex flex-wrap gap-3">
              <FilterTab active={filter === "all"} onClick={() => setFilter("all")} count={stats.total}>
                📋 Alle
              </FilterTab>
              <FilterTab active={filter === "active"} onClick={() => setFilter("active")} count={stats.total - orders.filter(o => ["completed", "cancelled"].includes(o.order_status)).length}>
                ⚡ Aktiv
              </FilterTab>
              <FilterTab active={filter === "urgent"} onClick={() => setFilter("urgent")} count={stats.urgent}>
                🚨 Dringend
              </FilterTab>
              <FilterTab active={filter === "unpaid"} onClick={() => setFilter("unpaid")} count={stats.unpaid}>
                💳 Unbezahlt
              </FilterTab>
              <FilterTab active={filter === "pending"} onClick={() => setFilter("pending")} count={stats.pending}>
                ⏳ Wartend
              </FilterTab>
              <FilterTab active={filter === "preparing"} onClick={() => setFilter("preparing")} count={stats.preparing}>
                👨‍🍳 In Arbeit
              </FilterTab>
              <FilterTab active={filter === "ready"} onClick={() => setFilter("ready")} count={stats.ready}>
                🔔 Fertig
              </FilterTab>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Keine Bestellungen gefunden</h3>
                  <p className="text-slate-500">
                    {filter === "all" ? "Noch keine Bestellungen eingegangen" : `Keine Bestellungen im Filter "${filter}"`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      {filteredOrders.length} {filteredOrders.length === 1 ? 'Bestellung' : 'Bestellungen'}
                      {filter !== "all" && (
                        <span className="text-slate-400 text-base font-normal ml-2">
                          • Filter: {filter}
                        </span>
                      )}
                    </h2>
                    
                    <div className="text-sm text-slate-400">
                      Sortiert nach Eingangzeit
                    </div>
                  </div>
                  
                  {filteredOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <OrderCard
                        order={order}
                        onStatusUpdate={setStatus}
                        onPaymentUpdate={setPaid}
                        isUpdating={updatingOrder === order.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            {filteredOrders.length > 0 && (
              <div className="bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-6 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {stats.totalRevenue.toFixed(2)} €
                    </div>
                    <div className="text-slate-400 text-sm">Gesamtumsatz</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {stats.avgOrderValue.toFixed(2)} €
                    </div>
                    <div className="text-slate-400 text-sm">⌀ Bestellwert</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {stats.today}
                    </div>
                    <div className="text-slate-400 text-sm">Heute</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {((stats.total - orders.filter(o => ["completed", "cancelled"].includes(o.order_status)).length) / Math.max(stats.total, 1) * 100).toFixed(0)}%
                    </div>
                    <div className="text-slate-400 text-sm">Aktive Rate</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(10deg);
            }
          }
          
          @keyframes counter {
            from {
              transform: scale(1.2);
            }
            to {
              transform: scale(1);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-counter {
            animation: counter 0.3s ease-out;
          }
          
          .animation-delay-150 {
            animation-delay: 150ms;
          }
        `
      }} />
    </div>
  );
}