import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTables, getCurrentTotal, type TableRow } from "../api";

type TotalMap = Record<string, number>;

// Animated Background Particles Component
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/5 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/5 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-purple-500/5 rounded-full animate-pulse delay-2000"></div>
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/10 to-transparent animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/5 to-transparent animate-pulse delay-500"></div>
      
      {/* Floating data points */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/20 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// Enhanced Metric Card with 3D effect
const MetricCard = ({ title, value, icon, color, trend, delay = 0 }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}) => {
  return (
    <div 
      className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500 blur-xl`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-r ${color} rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              trend.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <svg className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-emerald-400 transition-all duration-300">
            {value}
          </p>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
    </div>
  );
};

// Enhanced Table Card with status animations
const TableCard = ({ tableNumber, total, busy, onClick }: {
  tableNumber: string;
  total: number;
  busy: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-3xl p-6 text-left transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-2xl overflow-hidden ${
        busy 
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-400/50 hover:border-amber-400/80' 
          : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-emerald-500/50'
      }`}
    >
      {/* Pulsing status indicator */}
      <div className="absolute top-4 right-4">
        <div className={`relative w-4 h-4 rounded-full ${busy ? 'bg-red-400' : 'bg-emerald-400'}`}>
          {busy && (
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-50"></div>
          )}
        </div>
      </div>

      {/* Table number with animated background */}
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
          busy 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25' 
            : 'bg-gradient-to-r from-slate-700 to-slate-800 group-hover:from-emerald-500 group-hover:to-emerald-600'
        }`}>
          <span className="text-xl font-bold text-white">{tableNumber}</span>
        </div>
        
        <div className={`text-xs font-medium ${busy ? 'text-amber-300' : 'text-slate-400'}`}>
          Tisch
        </div>
      </div>

      {/* Revenue with animated counter effect */}
      <div className="space-y-2">
        <div className={`text-xs font-medium ${busy ? 'text-amber-300' : 'text-slate-400'}`}>
          Offene Summe
        </div>
        <div className={`text-2xl font-bold transition-all duration-300 ${
          busy ? 'text-amber-300' : 'text-slate-300 group-hover:text-emerald-400'
        }`}>
          {total.toFixed(2)} €
        </div>
      </div>

      {/* Status badge */}
      {busy && (
        <div className="mt-4 inline-flex items-center gap-2 bg-red-500/20 text-red-200 text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          Aktive Bestellung
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300"></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-3xl"></div>
    </button>
  );
};

// Quick Action Button with enhanced effects
const QuickActionButton = ({ icon, title, description, color, onClick, delay = 0 }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  delay?: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:border-emerald-500/50 animate-fadeInUp overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500 blur-xl`}></div>
      
      <div className="relative z-10 text-center space-y-3">
        <div className={`w-12 h-12 mx-auto bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          {icon}
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-emerald-400 transition-all duration-300">
            {title}
          </h4>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-2xl"></div>
    </button>
  );
};

export default function AdminHome() {
  const { slug = "" } = useParams();
  const nav = useNavigate();

  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [tables, setTables] = useState<TableRow[]>([]);
  const [totals, setTotals] = useState<TotalMap>({});
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<number | null>(null);

  function saveToken() {
    localStorage.setItem("adminToken", adminToken);
    load();
  }

  async function loadTotals(rows: TableRow[]) {
    setIsPolling(true);
    const entries = await Promise.all(
      rows.map(async (t) => {
        try {
          const r = await getCurrentTotal(slug, t.table_number);
          const total = Number(r?.data?.total ?? 0);
          return [String(t.table_number), total] as const;
        } catch {
          return [String(t.table_number), 0] as const;
        }
      })
    );
    const next: TotalMap = {};
    for (const [k, v] of entries) next[k] = v;
    setTotals(next);
    setIsPolling(false);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetchTables(slug);
      const rows = res.data || [];
      setTables(rows);
      await loadTotals(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [slug, adminToken]);

  // Enhanced polling with visual feedback
  useEffect(() => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      if (tables.length) loadTotals(tables);
    }, 5000) as unknown as number; // Reduced to 5s for more real-time feel
    return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
  }, [tables, slug]);

  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => Number(a.table_number) - Number(b.table_number));
  }, [tables]);

  const stats = useMemo(() => {
    const busyTables = sortedTables.filter(t => (totals[String(t.table_number)] ?? 0) > 0.0001);
    const totalRevenue = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    return {
      totalTables: sortedTables.length,
      busyTables: busyTables.length,
      freeTables: sortedTables.length - busyTables.length,
      totalRevenue,
      occupancyRate: sortedTables.length > 0 ? (busyTables.length / sortedTables.length) * 100 : 0
    };
  }, [sortedTables, totals]);

  function openOrdersFor(tableNumber: string | number) {
    nav(`/a/${encodeURIComponent(slug)}/orders?table=${encodeURIComponent(String(tableNumber))}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Enhanced Header with live indicator */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-400 to-white bg-clip-text text-transparent">
                  Tischübersicht
                </h1>
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              <p className="text-slate-400">Restaurant {slug} • {stats.occupancyRate.toFixed(0)}% Auslastung</p>
            </div>
            
            {/* Enhanced polling indicator */}
            <div className="flex items-center gap-4">
              {isPolling && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                  <span className="text-sm font-medium">Synchronisiert...</span>
                </div>
              )}
              <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                Updates alle 5s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Token Input */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-5m5 0v.01M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2h5m-5 0v.01" />
                </svg>
                Admin Authentifizierung
              </label>
              <input
                type="password"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="X-Admin-Token eingeben..."
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <button 
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/25 transform active:scale-95"
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
                <div className="w-20 h-20 mx-auto border-4 border-slate-600/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-emerald-400/50 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div>
                <p className="text-slate-300 text-xl font-medium">Lade Dashboard...</p>
                <p className="text-slate-500 text-sm mt-1">Verbinde mit Backend</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <MetricCard
                title="Tische Gesamt"
                value={stats.totalTables}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                color="from-blue-600 to-blue-700"
                delay={0}
              />

              <MetricCard
                title="Belegte Tische"
                value={stats.busyTables}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                color="from-emerald-600 to-emerald-700"
                trend={{ value: 12, isPositive: true }}
                delay={100}
              />

              <MetricCard
                title="Freie Tische"
                value={stats.freeTables}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                color="from-slate-600 to-slate-700"
                delay={200}
              />

              <MetricCard
                title="Offene Summe"
                value={`${stats.totalRevenue.toFixed(2)} €`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                color="from-amber-600 to-amber-700"
                trend={{ value: 8, isPositive: true }}
                delay={300}
              />
            </div>

            {/* Enhanced Tables Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Live Tischstatus</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-400">Frei</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-400">Belegt</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {sortedTables.map((t, index) => {
                  const tn = String(t.table_number);
                  const total = totals[tn] ?? 0;
                  const busy = total > 0.0001;
                  
                  return (
                    <div
                      key={tn}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCard
                        tableNumber={tn}
                        total={total}
                        busy={busy}
                        onClick={() => openOrdersFor(tn)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Schnellzugriff
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton
                  icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  title="Bestellungen"
                  description="Alle Bestellungen verwalten"
                  color="from-blue-600 to-blue-700"
                  onClick={() => nav(`/a/${encodeURIComponent(slug)}/orders`)}
                  delay={0}
                />

                <QuickActionButton
                  icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                  title="Menü"
                  description="Artikel bearbeiten"
                  color="from-emerald-600 to-emerald-700"
                  onClick={() => nav(`/a/${encodeURIComponent(slug)}/menu`)}
                  delay={100}
                />

                <QuickActionButton
                  icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  title="Tische"
                  description="QR-Codes verwalten"
                  color="from-purple-600 to-purple-700"
                  onClick={() => nav(`/a/${encodeURIComponent(slug)}/tables`)}
                  delay={200}
                />

                <QuickActionButton
                  icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                  title="Refresh"
                  description="Daten aktualisieren"
                  color="from-slate-600 to-slate-700"
                  onClick={() => window.location.reload()}
                  delay={300}
                />
              </div>
            </div>
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
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          
          .animation-delay-150 {
            animation-delay: 150ms;
          }
        `
      }} />
    </div>
  );
}