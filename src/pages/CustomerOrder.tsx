// src/pages/CustomerOrder.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchCustomerMenu, submitOrder } from "../api";
import type { MenuItem } from "../types";
import MenuItemCard from "../components/MenuItemCard";

type CartLine = { item: MenuItem; qty: number };

export default function CustomerOrder() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [tableToken] = useState(searchParams.get("t") || "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCustomerMenu(slug);
        setItems(res.data.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Auto-extract table number from token or URL
  useEffect(() => {
    const urlTable = searchParams.get("table");
    if (urlTable) setTableNumber(urlTable);
  }, [searchParams]);

  const total = useMemo(() => cart.reduce((s, l) => s + l.item.price * l.qty, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const ix = prev.findIndex((l) => l.item.id === item.id);
      if (ix >= 0) {
        const clone = [...prev];
        clone[ix] = { ...clone[ix], qty: clone[ix].qty + 1 };
        return clone;
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) => {
      return prev.map(l => {
        if (l.item.id === id) {
          const newQty = l.qty + delta;
          return newQty <= 0 ? null : { ...l, qty: newQty };
        }
        return l;
      }).filter(Boolean) as CartLine[];
    });
  }

  function removeFromCart(id: number) {
    setCart(prev => prev.filter(l => l.item.id !== id));
  }

  async function handleSubmit() {
    if (!tableNumber) { 
      alert("Bitte Tischnummer eingeben."); 
      return; 
    }
    if (cart.length === 0) { 
      alert("Warenkorb ist leer."); 
      return; 
    }
    
    setSubmitting(true);
    try {
      const payload = {
        table_number: tableNumber,
        table_token: tableToken,
        items: cart.map(l => ({ menu_item_id: l.item.id, quantity: l.qty })),
        customer_notes: note,
      };
      const res = await submitOrder(slug, payload);
      setOrderSuccess(res.data.order_number);
      setCart([]);
      setNote("");
      setShowCart(false);
    } catch (e: any) {
      alert(e.message || "Fehler beim Bestellen");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Lade Menü...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md w-full transform animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Bestellung aufgenommen!</h3>
            <p className="text-gray-600 mb-2">Bestellnummer:</p>
            <p className="text-xl font-mono font-bold text-indigo-600 mb-6">{orderSuccess}</p>
            <button 
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition-colors"
              onClick={() => setOrderSuccess(null)}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Menü
              </h1>
              {tableNumber && (
                <p className="text-sm text-gray-600">Tisch {tableNumber}</p>
              )}
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:bg-indigo-700 transition-all duration-200 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
                Warenkorb
              </span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAdd={addToCart}
              cartQty={cart.find(l => l.item.id === item.id)?.qty || 0}
            />
          ))}
        </div>
      </div>

      {/* Cart Slide-over */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Warenkorb</h2>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {totalItems > 0 && (
                  <p className="text-indigo-100 text-sm mt-1">{totalItems} Artikel</p>
                )}
              </div>

              {/* Table Number Input */}
              <div className="p-4 bg-gray-50 border-b">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tischnummer</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="z.B. 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                      </svg>
                    </div>
                    <p className="text-gray-500">Warenkorb ist leer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((line) => (
                      <div key={line.item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{line.item.name}</h4>
                            <p className="text-indigo-600 font-medium">{line.item.price.toFixed(2)} €</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(line.item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-gray-100 rounded-xl">
                            <button
                              onClick={() => changeQty(line.item.id, -1)}
                              className="p-2 hover:bg-gray-200 rounded-l-xl transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="px-4 py-2 font-semibold">{line.qty}</span>
                            <button
                              onClick={() => changeQty(line.item.id, 1)}
                              className="p-2 hover:bg-gray-200 rounded-r-xl transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <div className="font-bold text-lg">{(line.item.price * line.qty).toFixed(2)} €</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes and Checkout */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mb-4"
                    placeholder="Besondere Wünsche oder Anmerkungen..."
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  
                  <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Gesamt</span>
                      <span className="text-2xl font-bold text-indigo-600">{total.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !tableNumber}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Wird gesendet...
                      </span>
                    ) : (
                      "Bestellung abschicken"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}