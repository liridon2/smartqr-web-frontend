import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

// Dark Theme Background Component
const DarkBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Floating food icons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl opacity-5 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        >
          {['🍕', '🍔', '🍝', '🥗', '🍖', '🍤', '🍰', '☕'][i]}
        </div>
      ))}
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="customerGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f2937" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#customerGrid)" />
        </svg>
      </div>
    </div>
  );
};

// Enhanced Menu Item Card
const MenuItemCard = ({ item, quantity, onAdd, onSub }: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onSub: () => void;
}) => {
  return (
    <article className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 overflow-hidden">
      {/* Quantity indicator */}
      {quantity > 0 && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
          {quantity}
        </div>
      )}

      {/* Item image placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-4xl mb-2">🍽️</div>
            <div className="text-xs font-medium">Kein Bild</div>
          </div>
        )}
        
        {/* Price badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-sm font-bold">
          {money(item.price)}
        </div>
      </div>

      {/* Item content */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-xl text-white group-hover:text-emerald-400 transition-colors duration-300">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-400">
            {money(item.price)}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onSub}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-red-600 text-white border border-slate-600 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 disabled:hover:scale-100 flex items-center justify-center"
              disabled={!quantity}
              aria-label="Minus"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="w-8 text-center font-mono text-white text-lg font-bold">
              {quantity || 0}
            </div>
            
            <button
              onClick={onAdd}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-110 flex items-center justify-center"
              aria-label="Plus"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
    </article>
  );
};

// Enhanced Cart Summary Component
const CartSummary = ({ items, total, notes, onNotesChange, onClear, onSubmit, submitting, disabled }: {
  items: Array<{item: MenuItem; qty: number}>;
  total: number;
  notes: string;
  onNotesChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Warenkorb</h2>
        {items.length > 0 && (
          <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-sm font-medium">
            {items.length} Artikel
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
            </svg>
          </div>
          <p className="text-slate-400">Noch keine Artikel ausgewählt.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map(({ item, qty }) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-slate-400">{qty} × {money(item.price)}</div>
                </div>
                <div className="font-bold text-emerald-400">{money(item.price * qty)}</div>
              </div>
            ))}
          </div>

          {/* Anmerkungen Field */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-medium">Anmerkungen</span>
            </div>
            <textarea
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none text-sm"
              rows={3}
              placeholder="Allergien, Sonderwünsche, etc..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>

          {/* Total */}
          <div className="border-t border-slate-700/50 pt-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-slate-300">Gesamt:</span>
              <span className="font-bold text-2xl text-emerald-400">{money(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClear}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Leeren
            </button>
            <button
              onClick={onSubmit}
              className="flex-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25"
              disabled={disabled || submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sende...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Bestellen
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ orderNumber, total, onClose }: {
  orderNumber: string;
  total: number;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-8 max-w-md w-full animate-scaleIn">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Bestellung aufgenommen!</h3>
            <p className="text-slate-400">Ihre Bestellung wurde erfolgreich übermittelt</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-2xl p-4 space-y-2">
            <div className="text-slate-400 text-sm">Bestellnummer:</div>
            <div className="text-xl font-mono font-bold text-emerald-400">{orderNumber}</div>
            <div className="text-slate-400 text-sm">Gesamtbetrag:</div>
            <div className="text-2xl font-bold text-white">{money(total)}</div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};

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
        const tn = j?.data?.table_number ?? j?.table_number ?? j?.data?.table ?? j?.table ?? "";
        if (!cancel) setResolvedTableNumber(String(tn));
      } catch (e) {
        console.warn("Token→Nummer failed:", e);
      }
    }
    resolveNumber();
    return () => { cancel = true; };
  }, [slug, tableToken]);

  // Cart im localStorage speichern
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  // Berechnungen
  const itemsInCart = useMemo(() => {
    const pairs: Array<{ item: MenuItem; qty: number }> = [];
    for (const [idStr, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const item = menu.find((it) => it.id === Number(idStr));
      if (item) pairs.push({ item, qty });
    }
    return pairs;
  }, [cart, menu]);

  const total = useMemo(() => {
    return itemsInCart.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  }, [itemsInCart]);

  // Cart-Funktionen
  const add = (id: number) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: number) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  const clearCart = () => setCart({});

  // Bestellen
  const onSubmit = async () => {
    if (itemsInCart.length === 0) return;

    const finalTableNumber = resolvedTableNumber || tableNumber;
    if (!finalTableNumber) {
      setError("Tischnummer konnte nicht ermittelt werden.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        table_number: finalTableNumber,
        table_token: tableToken,
        items: itemsInCart.map(({ item, qty }) => ({
          menu_item_id: item.id,
          quantity: qty,
        })),
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_notes: customerNotes.trim() || null,
      };

      const res = await submitOrder(slug, payload);
      const orderNumber = res?.data?.order_number ?? res?.order_number ?? "Unbekannt";

      setSuccess({ order_number: orderNumber, total });
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerNotes("");
    } catch (e: any) {
      setError(e?.message || "Bestellung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated Background */}
      <DarkBackground />
      
      {/* Success Modal */}
      {success && (
        <SuccessModal
          orderNumber={success.order_number}
          total={success.total}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Header */}
      <header className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Main Title Section */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white via-emerald-400 to-white bg-clip-text text-transparent">
                  <span className="sm:hidden">Menü</span>
                  <span className="hidden sm:inline">Digitale Speisekarte</span>
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              
              {/* Table & Total Info - Mobile Stack */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm">
                <div className="text-slate-400">
                  Tisch: <span className="text-emerald-400 font-medium">
                    {resolvedTableNumber || tableNumber || "per Token"}
                  </span>
                </div>
                {total > 0 && (
                  <div className="text-slate-400 sm:border-l sm:border-slate-600 sm:pl-4">
                    Summe: <span className="text-emerald-400 font-bold">{money(total)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Restaurant Info - Compact for Mobile */}
            <div className="text-right sm:block">
              <div className="text-slate-400 text-xs sm:text-sm">Restaurant</div>
              <div className="text-sm sm:text-lg font-bold text-white truncate max-w-[120px] sm:max-w-none">
                {slug}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-sm animate-slideInUp">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-red-300 font-medium text-sm">Fehler</h4>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-slate-600/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-300 text-lg">Lade Menü...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Menu Grid */}
            {menu.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Keine Artikel verfügbar</h3>
                <p className="text-slate-500">Das Menü wird gerade aktualisiert</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menu.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MenuItemCard
                      item={item}
                      quantity={cart[item.id] || 0}
                      onAdd={() => add(item.id)}
                      onSub={() => sub(item.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Customer Info & Cart Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Customer Info Form */}

              {/* Cart Summary */}
              <CartSummary
                items={itemsInCart}
                total={total}
                onClear={clearCart}
                onSubmit={onSubmit}
                submitting={submitting}
                disabled={itemsInCart.length === 0}
                notes={customerNotes}
                onNotesChange={setCustomerNotes}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-semibold text-emerald-400">SmartQR</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </main>

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
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
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
          
          .animate-slideInUp {
            animation: slideInUp 0.4s ease-out forwards;
          }
          
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out;
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