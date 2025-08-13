import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { fetchTables, createTable, updateTable, deleteTable, freeTable, type TableRow, buildCustomerUrl } from "../api";

// Enhanced QR code generation with premium styling
function generateQRCode(canvas: HTMLCanvasElement, text: string, options = {}) {
  const {
    size = 280,
    foreground = '#1f2937',
    background = '#ffffff'
  } = options as any;
  
  const url = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(text)}&chco=${foreground.replace('#', '')}|${background.replace('#', '')}`;
  const ctx = canvas.getContext('2d'); 
  if (!ctx) return;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { 
    canvas.width = size; 
    canvas.height = size;
    
    // Add rounded corners background
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 20);
    ctx.fill();
    
    // Draw QR code
    ctx.drawImage(img, 10, 10, size - 20, size - 20);
    
    // Add premium border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(5, 5, size - 10, size - 10, 15);
    ctx.stroke();
  };
  img.src = url;
}

// Animated Background for Tables Management
const TablesBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating QR code symbols */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-6xl opacity-5 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 6}s`
          }}
        >
          {['📱', '📋', '🏷️', '🎯', '📊', '⚡', '🔗', '📍', '🎪', '✨'][i]}
        </div>
      ))}
      
      {/* Dynamic grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Animated gradient waves */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-emerald-900/10 animate-pulse"></div>
    </div>
  );
};

// Enhanced Stats Card for Tables
const TableStatsCard = ({ title, value, subtitle, icon, color, trend, isActive, delay = 0 }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
  isActive?: boolean;
  delay?: number;
}) => {
  return (
    <div 
      className={`group relative ${color} rounded-3xl p-6 overflow-hidden hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-2xl animate-fadeInUp ${
        isActive ? 'ring-2 ring-purple-400/50 shadow-purple-500/20' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
        </div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            {icon}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium backdrop-blur-sm ${
              trend.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <svg className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-purple-300 transition-all duration-300">
            {value}
          </p>
          {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
    </div>
  );
};

// Enhanced Table Row with Visual Improvements
const EnhancedTableRow = ({ table, onEdit, onFree, onShowQR, onDelete, isWorking }: {
  table: TableRow;
  onEdit: () => void;
  onFree: () => void;
  onShowQR: () => void;
  onDelete: () => void;
  isWorking: boolean;
}) => {
  const token = (table as any).table_token;
  const hasQR = Boolean(token);
  
  return (
    <tr className="group hover:bg-slate-700/30 transition-all duration-300">
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">{table.id}</span>
          </div>
          <span className="text-slate-300 font-mono text-sm">{table.id}</span>
        </div>
      </td>
      
      <td className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-lg">{String(table.table_number).charAt(0)}</span>
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{String(table.table_number)}</div>
            <div className="text-slate-400 text-xs">Tischnummer</div>
          </div>
        </div>
      </td>
      
      <td className="p-6">
        {hasQR ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600/20 border border-emerald-500/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <div className="text-emerald-400 text-sm font-medium">Verfügbar</div>
              <div className="text-slate-500 font-mono text-xs">{token.slice(0, 8)}...</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600/20 border border-red-500/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="text-red-400 text-sm font-medium">Kein QR-Code</div>
              <div className="text-slate-500 text-xs">Nicht verfügbar</div>
            </div>
          </div>
        )}
      </td>
      
      <td className="p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onEdit}
            disabled={isWorking}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">Bearbeiten</span>
          </button>
          
          <button
            onClick={onFree}
            disabled={isWorking}
            className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 text-yellow-300 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Freigeben</span>
          </button>
          
          {hasQR && (
            <button
              onClick={onShowQR}
              className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="hidden sm:inline">QR-Code</span>
            </button>
          )}
          
          <button
            onClick={onDelete}
            disabled={isWorking}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            {isWorking ? (
              <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            <span className="hidden sm:inline">Löschen</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

// Enhanced QR Modal with Premium Features
const QRModal = ({ qrData, onClose, onDownload }: {
  qrData: { tn: string | number; token: string };
  onClose: () => void;
  onDownload: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'pdf'>('png');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setTimeout(() => {
      generateQRCode(canvas, buildCustomerUrl(qrData.token.split('/')[2] || 'demo-restaurant', qrData.token), {
        size: 300,
        foreground: '#1f2937',
        background: '#ffffff'
      });
    }, 100);
  }, [qrData]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-8 max-w-lg w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              QR-Code für Tisch {String(qrData.tn)}
            </h3>
            <p className="text-slate-400 text-sm mt-1">Gäste scannen diesen Code zum Bestellen</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* QR Code Display */}
        <div className="relative mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-2xl mx-auto w-fit relative group">
            {/* Hologram effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <canvas 
              ref={canvasRef} 
              className="rounded-2xl relative z-10 shadow-lg group-hover:scale-105 transition-transform duration-300" 
            />
            
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-20 animate-pulse"></div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full opacity-30 animate-pulse delay-1000"></div>
        </div>
        
        {/* URL Display */}
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-purple-400 text-sm font-medium">Bestellungs-URL:</span>
          </div>
          <div className="text-slate-300 text-sm font-mono break-all bg-slate-900/50 p-3 rounded-xl border border-slate-600/30">
            {buildCustomerUrl(qrData.token.split('/')[2] || 'demo-restaurant', qrData.token)}
          </div>
        </div>
        
        {/* Download Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Download-Format:</label>
            <div className="flex gap-2">
              {[
                { value: 'png', label: 'PNG', icon: '🖼️' },
                { value: 'svg', label: 'SVG', icon: '📐' },
                { value: 'pdf', label: 'PDF', icon: '📄' }
              ].map(format => (
                <button
                  key={format.value}
                  onClick={() => setDownloadFormat(format.value as any)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    downloadFormat === format.value
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-2">{format.icon}</span>
                  {format.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onDownload}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {downloadFormat.toUpperCase()}
            </button>
            
            <button 
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminTables() {
  const { slug = "" } = useParams();
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);

  const [formNumber, setFormNumber] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [qrOf, setQrOf] = useState<{ tn: string | number; token: string } | null>(null);

  function saveToken() {
    localStorage.setItem("adminToken", adminToken);
    load();
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetchTables(slug);
      setRows(res.data || []);
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { load(); }, [slug, adminToken]);

  async function onCreate() {
    const tn = formNumber.trim();
    if (!tn) { 
      alert('Bitte eine Tischnummer eingeben!'); 
      return; 
    }
    
    setWorking(-1);
    try {
      await createTable(slug, tn);
      setFormNumber("");
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onUpdate() {
    if (!editId) return;
    const tn = formNumber.trim();
    
    setWorking(editId);
    try {
      await updateTable(slug, editId, tn);
      setEditId(null); 
      setFormNumber("");
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Tisch wirklich löschen? Alle zugehörigen Bestellungen gehen verloren!')) return;
    
    setWorking(id);
    try {
      await deleteTable(slug, id);
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onFree(tn: string | number) {
    if (!confirm(`Alle Bestellungen für Tisch ${tn} löschen und Tisch freigeben?`)) return;
    
    setWorking(-2);
    try {
      await freeTable(slug, tn);
      await load();
    } finally {
      setWorking(null);
    }
  }

  function openQr(tn: string | number, token?: string | null) {
    if (!token) { 
      alert('Kein QR-Token verfügbar. Tisch muss neu erstellt werden.'); 
      return; 
    }
    setQrOf({ tn, token });
  }

  function downloadQr() {
    alert('Download-Funktion würde hier implementiert werden!');
    setQrOf(null);
  }

  function startEdit(r: TableRow) {
    setEditId(Number(r.id));
    setFormNumber(String(r.table_number));
  }

  function cancelEdit() {
    setEditId(null); 
    setFormNumber("");
  }

  const stats = useMemo(() => {
    const withTokens = rows.filter(r => (r as any).table_token);
    const withoutTokens = rows.filter(r => !(r as any).table_token);
    
    return {
      total: rows.length,
      withTokens: withTokens.length,
      withoutTokens: withoutTokens.length,
      qrCoverage: rows.length > 0 ? (withTokens.length / rows.length) * 100 : 0
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <TablesBackground />
      
      {/* Enhanced Header */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-400 to-white bg-clip-text text-transparent">
                  Tische & QR-Codes
                </h1>
                <div className="flex items-center gap-2 bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  MANAGEMENT
                </div>
              </div>
              <p className="text-slate-400">
                Restaurant {slug} • {stats.qrCoverage.toFixed(0)}% QR-Abdeckung
              </p>
            </div>
            
            <div className="text-purple-400 text-sm font-medium">
              {stats.total} Tische • {stats.withTokens} mit QR-Code
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
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-5m5 0v.01M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2h5m-5 0v.01" />
                </svg>
                Admin Authentifizierung
              </label>
              <input
                type="password"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="X-Admin-Token eingeben..."
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              onClick={saveToken}
            >
              Speichern
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editId ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {editId ? 'Tisch bearbeiten' : 'Neuen Tisch hinzufügen'}
            </h2>
          </div>
          
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tischnummer
              </label>
              <input
                type="text"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="z.B. 1, A5, VIP-1, Terrasse-12..."
                value={formNumber}
                onChange={e => setFormNumber(e.target.value)}
              />
            </div>
            
            {editId ? (
              <div className="flex gap-3">
                <button
                  onClick={onUpdate}
                  disabled={working === editId}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg"
                >
                  {working === editId ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Speichert...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Speichern
                    </span>
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={working === editId}
                  className="bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                onClick={onCreate}
                disabled={working === -1}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 whitespace-nowrap shadow-lg"
              >
                {working === -1 ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Erstellt...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tisch anlegen
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto border-4 border-slate-600/30 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-purple-400/50 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div>
                <p className="text-slate-300 text-xl font-medium">Lade Tische...</p>
                <p className="text-slate-500 text-sm mt-1">Synchronisiere QR-Codes</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <TableStatsCard
                title="Tische gesamt"
                value={stats.total}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                color="bg-slate-800/50"
                delay={0}
              />

              <TableStatsCard
                title="Mit QR-Code"
                value={stats.withTokens}
                subtitle={`${stats.qrCoverage.toFixed(0)}% Abdeckung`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
                color="bg-emerald-600/20"
                trend={{ value: 8, isPositive: true }}
                isActive={stats.withTokens > 0}
                delay={100}
              />

              <TableStatsCard
                title="Ohne QR-Code"
                value={stats.withoutTokens}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                color="bg-red-600/20"
                delay={200}
              />

              <TableStatsCard
                title="QR-Downloads"
                value="∞"
                subtitle="Unbegrenzt verfügbar"
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                color="bg-blue-600/20"
                delay={300}
              />
            </div>

            {/* Tables List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Alle Tische</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-400">Mit QR-Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-slate-400">Ohne QR-Code</span>
                  </div>
                </div>
              </div>
              
              {rows.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Noch keine Tische angelegt</h3>
                  <p className="text-slate-500">Erstelle deinen ersten Tisch mit dem Formular oben</p>
                </div>
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50 backdrop-blur-sm">
                        <tr>
                          <th className="text-left p-6 text-slate-300 font-semibold">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              ID
                            </div>
                          </th>
                          <th className="text-left p-6 text-slate-300 font-semibold">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Tischnummer
                            </div>
                          </th>
                          <th className="text-left p-6 text-slate-300 font-semibold">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              QR-Code Status
                            </div>
                          </th>
                          <th className="text-left p-6 text-slate-300 font-semibold">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                              </svg>
                              Aktionen
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {rows.map((row, index) => (
                          <div
                            key={row.id}
                            className="animate-fadeInUp"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <EnhancedTableRow
                              table={row}
                              onEdit={() => startEdit(row)}
                              onFree={() => onFree(row.table_number)}
                              onShowQR={() => openQr(row.table_number, (row as any).table_token)}
                              onDelete={() => onDelete(Number(row.id))}
                              isWorking={working === Number(row.id)}
                            />
                          </div>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Bulk-Aktionen
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 p-6 rounded-2xl transition-all duration-200 hover:scale-105 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <div className="font-medium">Alle QR-Codes</div>
                  <div className="text-xs text-blue-200">Als ZIP herunterladen</div>
                </button>

                <button className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 p-6 rounded-2xl transition-all duration-200 hover:scale-105 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.5a2 2 0 00-2 2v4a2 2 0 002 2h2m7-4v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m6-4V9a2 2 0 012-2h2a2 2 0 012 2v2M7 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <div className="font-medium">Print Layout</div>
                  <div className="text-xs text-emerald-200">Druckvorlage erstellen</div>
                </button>

                <button className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 p-6 rounded-2xl transition-all duration-200 hover:scale-105 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="font-medium">Alle erneuern</div>
                  <div className="text-xs text-purple-200">QR-Codes neu generieren</div>
                </button>

                <button className="bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/50 text-slate-300 p-6 rounded-2xl transition-all duration-200 hover:scale-105 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-slate-200">QR-Code Statistiken</div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced QR Modal */}
      {qrOf && (
        <QRModal
          qrData={qrOf}
          onClose={() => setQrOf(null)}
          onDownload={downloadQr}
        />
      )}

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
              transform: translateY(-25px) rotate(8deg);
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          
          .animate-float {
            animation: float 10s ease-in-out infinite;
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out;
          }
          
          .animation-delay-150 {
            animation-delay: 150ms;
          }
        `
      }} />
    </div>
  );
}