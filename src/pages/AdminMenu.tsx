import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { fetchAdminMenu, addMenuItem, updateMenuItem, toggleItem, deleteMenuItem } from "../api";
import type { MenuItem } from "../types";

// Animated Background for Menu Management
const MenuBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating food icons */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-6xl opacity-5 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        >
          {['🍕', '🍔', '🍝', '🥗', '🍖', '🍤', '🍰', '☕', '🍷', '🥘', '🍜', '🥙'][i]}
        </div>
      ))}
      
      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-purple-900/10 animate-pulse"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5 animate-pulse">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <g fill="#334155" fillOpacity="0.1">
              <circle cx="30" cy="30" r="2"/>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

// Enhanced Stats Card for Menu Analytics
const MenuStatsCard = ({ title, value, subtitle, icon, color, trend, delay = 0 }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}) => {
  return (
    <div 
      className={`group relative ${color} rounded-3xl p-6 overflow-hidden hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-2xl animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
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
          <p className="text-3xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-emerald-300 transition-all duration-300">
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

// Enhanced Menu Item Card with Visual Appeal
const EnhancedMenuItemCard = ({ item, onEdit, onToggle, onDelete, isWorking }: {
  item: MenuItem;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isWorking: boolean;
}) => {
  const available = Number(item.is_available) === 1 || item.is_available === true;
  
  // Generate food category color based on item name
  const getCategoryColor = (name: string) => {
    const colors = [
      'from-red-500 to-pink-600',
      'from-orange-500 to-red-600', 
      'from-yellow-500 to-orange-600',
      'from-green-500 to-emerald-600',
      'from-blue-500 to-cyan-600',
      'from-purple-500 to-pink-600',
      'from-indigo-500 to-purple-600'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`group relative bg-slate-800/50 backdrop-blur-xl border rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden ${
      available ? 'border-slate-700/50 hover:border-emerald-500/50' : 'border-red-500/30 hover:border-red-500/50'
    }`}>
      
      {/* Availability indicator */}
      <div className="absolute top-4 right-4">
        <div className={`relative w-4 h-4 rounded-full ${available ? 'bg-emerald-400' : 'bg-red-400'}`}>
          {available && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-40"></div>}
          {!available && <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse opacity-60"></div>}
        </div>
      </div>

      {/* Food Image Placeholder */}
      <div className={`w-full h-32 bg-gradient-to-br ${getCategoryColor(item.name)} rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-300`}>
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-white/80">
            <div className="text-4xl mb-2">🍽️</div>
            <div className="text-xs font-medium">Kein Bild</div>
          </div>
        )}
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        {/* Price badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-sm font-bold">
          {Number(item.price).toFixed(2)} €
        </div>
      </div>

      {/* Item Details */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-emerald-400 transition-all duration-300 mb-2">
            {item.name}
          </h3>
          
          {item.description && (
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
          available 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
          {available ? 'Verfügbar' : 'Nicht verfügbar'}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            disabled={isWorking}
            className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWorking ? (
              <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin mx-auto"></div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bearbeiten
              </span>
            )}
          </button>
          
          <button
            onClick={onToggle}
            disabled={isWorking}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border ${
              available 
                ? 'bg-red-600/20 hover:bg-red-600/30 border-red-500/50 text-red-300' 
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {isWorking ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {available ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M5.636 5.636L12 12" />
                    </svg>
                    Deaktivieren
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aktivieren
                  </>
                )}
              </span>
            )}
          </button>
          
          <button
            onClick={onDelete}
            disabled={isWorking}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWorking ? (
              <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
    </div>
  );
};

// Enhanced Form Component
const MenuItemForm = ({ form, setForm, editing, onCreate, onUpdate, onCancel, working }: {
  form: {id?: number; name: string; price: string; description?: string};
  setForm: React.Dispatch<React.SetStateAction<{id?: number; name: string; price: string; description?: string}>>;
  editing: boolean;
  onCreate: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  working: boolean;
}) => {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {editing ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">
          {editing ? 'Artikel bearbeiten' : 'Neuer Artikel'}
        </h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Artikelname *
          </label>
          <input
            type="text"
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="z.B. Margherita Pizza, Wiener Schnitzel..."
            value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Preis * (€)
          </label>
          <input
            type="text"
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="z.B. 12.50, 8,90"
            value={form.price}
            onChange={e => setForm(f => ({...f, price: e.target.value}))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Beschreibung
          </label>
          <textarea
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm resize-none"
            placeholder="Beschreibung der Zutaten, Allergene, Besonderheiten..."
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({...f, description: e.target.value}))}
          />
        </div>
        
        <div className="flex gap-4 pt-4">
          {editing ? (
            <>
              <button
                onClick={onUpdate}
                disabled={working}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {working ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Speichert...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Änderungen speichern
                  </span>
                )}
              </button>
              
              <button
                onClick={onCancel}
                disabled={working}
                className="bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={onCreate}
              disabled={working}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              {working ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Erstellt...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Artikel hinzufügen
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminMenu() {
  const { slug = "" } = useParams();
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{id?: number; name: string; price: string; description?: string}>({ name: "", price: "" });
  const [editing, setEditing] = useState<boolean>(false);
  const [working, setWorking] = useState<number | null>(null);

  function saveToken() {
    localStorage.setItem("adminToken", adminToken);
    load();
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetchAdminMenu(slug);
      const list = Array.isArray(res?.data?.items) ? res.data.items : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [slug, adminToken]);

  function resetForm() { 
    setForm({ name: "", price: "", description: "" }); 
    setEditing(false); 
  }

  async function onCreate() {
    const price = parseFloat(form.price.replace(",", "."));
    if (!form.name || !price) { 
      alert("Name und Preis sind erforderlich!"); 
      return; 
    }
    
    setWorking(-1);
    try {
      await addMenuItem(slug, { 
        name: form.name, 
        price, 
        description: form.description || "", 
        is_available: true 
      });
      resetForm();
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onUpdate() {
    if (!form.id) return;
    const price = parseFloat(form.price.replace(",", "."));
    
    setWorking(form.id);
    try {
      await updateMenuItem(slug, { 
        id: form.id, 
        name: form.name, 
        price, 
        description: form.description || "" 
      });
      resetForm();
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onToggle(id: number) {
    setWorking(id);
    try {
      await toggleItem(slug, id);
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Artikel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    
    setWorking(id);
    try {
      await deleteMenuItem(slug, id);
      await load();
    } finally {
      setWorking(null);
    }
  }

  function startEdit(it: MenuItem) {
    setForm({ 
      id: it.id, 
      name: it.name, 
      price: String(it.price), 
      description: it.description || "" 
    });
    setEditing(true);
  }

  const stats = useMemo(() => {
    const available = items.filter(it => Number(it.is_available) === 1 || it.is_available === true);
    const unavailable = items.filter(it => Number(it.is_available) === 0 || it.is_available === false);
    const avgPrice = items.length > 0 ? items.reduce((sum, it) => sum + it.price, 0) / items.length : 0;
    const maxPrice = Math.max(...items.map(it => it.price), 0);
    const minPrice = Math.min(...items.map(it => it.price), 0);
    
    return {
      total: items.length,
      available: available.length,
      unavailable: unavailable.length,
      avgPrice,
      maxPrice,
      minPrice,
      availabilityRate: items.length > 0 ? (available.length / items.length) * 100 : 0
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <MenuBackground />
      
      {/* Enhanced Header */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-400 to-white bg-clip-text text-transparent">
                  Menü verwalten
                </h1>
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  AKTIV
                </div>
              </div>
              <p className="text-slate-400">
                Restaurant {slug} • {stats.availabilityRate.toFixed(0)}% Verfügbarkeit
              </p>
            </div>
            
            <div className="text-emerald-400 text-sm font-medium">
              {stats.total} Artikel • {stats.available} verfügbar
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
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
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
                <p className="text-slate-300 text-xl font-medium">Lade Menü...</p>
                <p className="text-slate-500 text-sm mt-1">Synchronisiere Artikel</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <MenuStatsCard
                title="Artikel gesamt"
                value={stats.total}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                color="bg-slate-800/50"
                delay={0}
              />

              <MenuStatsCard
                title="Verfügbar"
                value={stats.available}
                subtitle={`${stats.availabilityRate.toFixed(0)}% Rate`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                color="bg-emerald-600/20"
                trend={{ value: 5, isPositive: true }}
                delay={100}
              />

              <MenuStatsCard
                title="Nicht verfügbar"
                value={stats.unavailable}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                color="bg-red-600/20"
                delay={200}
              />

              <MenuStatsCard
                title="⌀ Preis"
                value={`${stats.avgPrice.toFixed(2)} €`}
                subtitle={`${stats.minPrice.toFixed(2)} - ${stats.maxPrice.toFixed(2)} €`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                color="bg-amber-600/20"
                trend={{ value: 2, isPositive: false }}
                delay={300}
              />

              <MenuStatsCard
                title="Höchstpreis"
                value={`${stats.maxPrice.toFixed(2)} €`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="bg-purple-600/20"
                delay={400}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Alle Artikel</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      <span className="text-slate-400">Verfügbar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-slate-400">Nicht verfügbar</span>
                    </div>
                  </div>
                </div>
                
                {items.length === 0 ? (
                  <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Noch keine Artikel vorhanden</h3>
                    <p className="text-slate-500">Erstelle dein erstes Menü-Item mit dem Formular rechts</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <EnhancedMenuItemCard
                          item={item}
                          onEdit={() => startEdit(item)}
                          onToggle={() => onToggle(item.id)}
                          onDelete={() => onDelete(item.id)}
                          isWorking={working === item.id}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Form */}
              <div className="space-y-6">
                <MenuItemForm
                  form={form}
                  setForm={setForm}
                  editing={editing}
                  onCreate={onCreate}
                  onUpdate={onUpdate}
                  onCancel={resetForm}
                  working={working === form.id || working === -1}
                />
                
                {/* Pro Tips */}
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-sm">
                  <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Pro-Tipps für bessere Menüs
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">💡</span>
                      <span>Verwende appetitliche Beschreibungen mit Zutaten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">💰</span>
                      <span>Preise mit Punkt oder Komma eingeben (12.50 oder 12,50)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">🔄</span>
                      <span>Deaktivierte Artikel sind für Kunden nicht sichtbar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">📸</span>
                      <span>Artikel-Bilder werden automatisch optimiert angezeigt</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6 backdrop-blur-sm">
                  <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Menü-Analytics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Verfügbarkeitsrate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                            style={{ width: `${stats.availabilityRate}%` }}
                          ></div>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">{stats.availabilityRate.toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Preisspanne</span>
                      <span className="text-slate-300 text-sm font-medium">
                        {stats.minPrice.toFixed(2)} € - {stats.maxPrice.toFixed(2)} €
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Durchschnittspreis</span>
                      <span className="text-amber-400 text-sm font-medium">{stats.avgPrice.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
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
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          
          .animation-delay-150 {
            animation-delay: 150ms;
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
}