// CustomerOrder.tsx - Erweitert um Floating Action Button und Payment Modal

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  fetchCustomerMenu,
  fetchTableNumberByToken,
  submitOrder,
  getCurrentTotal,
} from "../api";
import type { MenuItem } from "../types";

type Cart = Record<number, number>;

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";
}

// Dark animated background component
const DarkBackground = () => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] opacity-30" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    </>
  );
};

// Payment Modal Component
const PaymentModal = ({ 
  isOpen, 
  onClose, 
  total 
}: {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}) => {
  if (!isOpen) return null;

  const paymentMethods = [
    { name: 'Kreditkarte', icon: '💳', color: 'from-blue-600 to-blue-700' },
    { name: 'PayPal', icon: '🅿️', color: 'from-blue-500 to-blue-600' },
    { name: 'Apple Pay', icon: '🍎', color: 'from-gray-800 to-black' },
    { name: 'Google Pay', icon: '🔵', color: 'from-green-600 to-green-700' },
    { name: 'SEPA Lastschrift', icon: '🏛️', color: 'from-indigo-600 to-indigo-700' },
    { name: 'Bar bezahlen', icon: '💵', color: 'from-green-600 to-green-700' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-6 max-w-md w-full animate-scaleIn max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Bezahlung</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-2xl p-6 border border-emerald-700/50">
            <div className="text-center space-y-2">
              <div className="text-slate-300 text-sm">Gesamtbetrag</div>
              <div className="text-4xl font-bold text-emerald-400">{money(total)}</div>
              <div className="text-slate-400 text-xs">inkl. MwSt.</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-lg">Zahlungsmethode wählen</div>
            <div className="grid gap-3">
              {paymentMethods.map((method, index) => (
                <button
                  key={method.name}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-r ${method.color} hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl text-white font-semibold flex items-center gap-4`}
                  onClick={() => {
                    // Hier später Stripe Integration
                    console.log(`Payment method selected: ${method.name}`);
                    alert(`${method.name} ausgewählt - Stripe Integration folgt`);
                  }}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="flex-1 text-left">{method.name}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-slate-900/50 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-green-400 text-xl">🔒</div>
            <div className="text-sm text-slate-300">
              <div className="font-semibold text-white mb-1">Sichere Zahlung</div>
              Ihre Zahlungsdaten werden verschlüsselt und sicher übertragen.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Menu Item Card Component
const MenuItemCard = ({
  item,
  quantity,
  onAdd,
  onSub,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onSub: () => void;
}) => {
  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:transform hover:scale-[1.02] shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10">
      {/* Image section */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6 bg-slate-700">
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

// Floating Action Button Component
const FloatingActionButton = ({ 
  total, 
  itemCount, 
  onClick,
  show = true
}: {
  total: number;
  itemCount: number;
  onClick: () => void;
  show?: boolean;
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        className="group relative bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-110 border-2 border-emerald-500/30"
      >
        {/* Notification Badge */}
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {itemCount}
        </div>
        
        {/* Payment Icon */}
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500" />
        
        {/* Total Amount Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-slate-700">
          {money(total)}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
        </div>
      </button>
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
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Table state - für Gesamtpreis des Tisches
  const [tableTotal, setTableTotal] = useState(0);
  const [hasOrderedBefore, setHasOrderedBefore] = useState(false);
  const [isTablePaid, setIsTablePaid] = useState(false);

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
        const tn = j?.data?.table_number ?? j?.table_number ?? j?.data?.table ?? j?.table ?? 
          j?.data?.number ?? j?.number ?? "";
        if (!cancel) setResolvedTableNumber(String(tn));
      } catch (e: any) {
        console.warn("Token -> Tischnummer failed:", e?.message || e);
      }
    }
    resolveNumber();
    return () => { cancel = true; };
  }, [slug, tableToken]);

  // Table Total laden (Gesamtpreis des Tisches)
  useEffect(() => {
    let cancel = false;
    async function loadTableTotal() {
      const finalTableNumber = resolvedTableNumber || tableNumber;
      if (!finalTableNumber) return;

      try {
        console.log("🔍 Loading table total for table:", finalTableNumber);
        const totalResult = await getCurrentTotal(slug, finalTableNumber);
        console.log("📊 Table total result:", totalResult);
        
        const total = Number(totalResult?.data?.total ?? totalResult?.total ?? 0);
        console.log("💰 Parsed table total:", total);
        
        if (!cancel) {
          setTableTotal(total);
          setHasOrderedBefore(total > 0);
          console.log("✅ Set table total:", total, "hasOrderedBefore:", total > 0);
        }
      } catch (e: any) {
        console.error("❌ Table total loading failed:", e);
      }
    }

    loadTableTotal();
    return () => { cancel = true; };
  }, [slug, resolvedTableNumber, tableNumber]);

  // Polling für Table Total (alle 10 Sekunden)
  useEffect(() => {
    const finalTableNumber = resolvedTableNumber || tableNumber;
    if (!finalTableNumber) return;

    const interval = setInterval(async () => {
      try {
        console.log("🔄 Polling table total for table:", finalTableNumber);
        const totalResult = await getCurrentTotal(slug, finalTableNumber);
        const total = Number(totalResult?.data?.total ?? totalResult?.total ?? 0);
        console.log("🔄 Polled table total:", total);
        setTableTotal(total);
        setHasOrderedBefore(total > 0);
      } catch (e) {
        console.warn("⚠️ Polling table total failed:", e);
      }
    }, 10000); // 10 Sekunden

    return () => clearInterval(interval);
  }, [slug, resolvedTableNumber, tableNumber]);

  // Cart persistent speichern
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  // Cart helpers
  const itemsInCart = useMemo(() => {
    return menu
      .map((item) => ({ item, qty: cart[item.id] || 0 }))
      .filter(({ qty }) => qty > 0);
  }, [menu, cart]);

  const total = useMemo(() => {
    return itemsInCart.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  }, [itemsInCart]);

  const totalItems = useMemo(() => {
    return itemsInCart.reduce((sum, { qty }) => sum + qty, 0);
  }, [itemsInCart]);

  const clearCart = () => setCart({});
  const addToCart = (itemId: number) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };
  const subFromCart = (itemId: number) => {
    setCart((prev) => {
      const newQty = (prev[itemId] || 0) - 1;
      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  // Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalTableNumber = resolvedTableNumber || tableNumber;
    if (!finalTableNumber) {
      setError("Tischnummer fehlt. Bitte QR-Code erneut scannen.");
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

      // Nach erfolgreicher Bestellung: Table Total neu laden mit Delay
      setTimeout(async () => {
        try {
          console.log("🔄 Reloading table total after successful order...");
          const totalResult = await getCurrentTotal(slug, finalTableNumber);
          const newTotal = Number(totalResult?.data?.total ?? totalResult?.total ?? 0);
          console.log("💰 New table total after order:", newTotal);
          setTableTotal(newTotal);
          setHasOrderedBefore(true);
        } catch (e) {
          console.warn("Failed to reload table total after order:", e);
        }
      }, 2000); // 2 Sekunden Delay für Backend-Update
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={tableTotal + total} // Gesamtpreis: Tisch + aktueller Warenkorb
      />

      {/* Floating Action Button - dauerhaft sichtbar sobald Tischnummer bekannt */}
      <FloatingActionButton
        total={tableTotal + total} // Tischpreis + aktueller Warenkorb
        itemCount={totalItems}
        onClick={() => setIsPaymentModalOpen(true)}
        show={!!(resolvedTableNumber || tableNumber)} // Immer sichtbar wenn Tischnummer da ist
      />

      {/* Header */}
      <header className="relative bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Main Title Section */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white via-emerald-400 to-white bg-clip-text text-transparent">
                  <span className="hidden sm:inline">SmartQR</span>
                  <span className="sm:hidden">SQR</span>
                </h1>
                <div className="w-1 h-6 sm:h-8 bg-emerald-400 rounded-full"></div>
                <div className="text-lg sm:text-xl font-semibold text-slate-300">
                  Digitale Speisekarte
                </div>
              </div>
              
              {/* Table Info */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium">
                  Tisch {resolvedTableNumber || tableNumber || "?"}
                </span>
                {resolvedTableNumber && tableNumber && resolvedTableNumber !== tableNumber && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-full border border-emerald-700/30">
                    via Token
                  </span>
                )}
              </div>
            </div>

            {/* Cart Summary - Zeigt immer Tischbetrag wenn Tischnummer bekannt */}
            {(totalItems > 0 || (resolvedTableNumber || tableNumber)) && (
              <div className="flex items-center gap-3 sm:gap-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl px-4 py-3 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-sm font-medium">
                    Tischbetrag:
                  </span>
                </div>
                <div className="w-0.5 h-6 bg-slate-600"></div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {money(tableTotal + total)}
                </div>
                {totalItems > 0 && (
                  <>
                    <div className="w-0.5 h-6 bg-slate-600"></div>
                    <div className="text-slate-400 text-sm">
                      + {totalItems} {totalItems === 1 ? "neuer Artikel" : "neue Artikel"}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-8"></div>
            <div className="text-xl font-semibold text-white mb-2">Menü wird geladen...</div>
            <div className="text-slate-400">Einen Moment bitte</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white mb-4">Fehler beim Laden</div>
            <div className="text-slate-400 mb-8 max-w-md">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Neu laden
            </button>
          </div>
        ) : menu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-8xl mb-8">🍽️</div>
            <div className="text-2xl font-bold text-white mb-4">Keine Artikel verfügbar</div>
            <div className="text-slate-400">Aktuell sind keine Menüartikel verfügbar.</div>
          </div>
        ) : (
          <>
            {/* Menu Grid */}
            <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-16">
              {menu.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onAdd={() => addToCart(item.id)}
                  onSub={() => subFromCart(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Customer Form - wird nur angezeigt wenn Artikel im Warenkorb sind */}
      {totalItems > 0 && (
        <div className="relative bg-slate-900/80 backdrop-blur-2xl border-t border-slate-700/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Header */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Bestellung abschließen</h2>
                <div className="flex items-center justify-center gap-4 bg-slate-800/50 rounded-2xl p-4 max-w-md mx-auto">
                  <div className="text-slate-400 text-sm">Neue Artikel:</div>
                  <div className="text-2xl font-bold text-emerald-400">{money(total)}</div>
                </div>
                {tableTotal > 0 && (
                  <div className="text-slate-400 text-sm">
                    Aktueller Tischbetrag: <span className="text-white font-semibold">{money(tableTotal)}</span>
                  </div>
                )}
              </div>

              {/* Warenkorb Details */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Warenkorb</h3>
                    <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-sm font-medium">
                      {totalItems} {totalItems === 1 ? "Artikel" : "Artikel"}
                    </div>
                  </div>

                  {/* Cart Items - Scrollable */}
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                    {itemsInCart.map(({ item, qty }) => (
                      <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="text-sm text-slate-400">{qty} × {money(item.price)}</div>
                        </div>
                        <div className="font-bold text-emerald-400">{money(item.price * qty)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-semibold text-slate-300">Gesamt:</span>
                      <span className="font-bold text-2xl text-emerald-400">{money(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid gap-6 sm:gap-8 max-w-2xl mx-auto">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="customerName" className="block text-sm font-semibold text-slate-300">
                      Name (optional)
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ihr Name"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="customerPhone" className="block text-sm font-semibold text-slate-300">
                      Telefon (optional)
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ihre Telefonnummer"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="customerNotes" className="block text-sm font-semibold text-slate-300">
                    Anmerkungen (optional)
                  </label>
                  <textarea
                    id="customerNotes"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Besondere Wünsche, Allergien, etc."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-red-400 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={submitting || totalItems === 0}
                  >
                    Leeren
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || totalItems === 0}
                    className="flex-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl hover:shadow-emerald-500/25"
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
            </form>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
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
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
          background-size: 20px 20px;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: rgb(71 85 105);
          border-radius: 0.375rem;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: rgb(30 41 59);
          border-radius: 0.375rem;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(71 85 105);
          border-radius: 0.375rem;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: rgb(30 41 59);
          border-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
}