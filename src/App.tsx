// src/App.tsx
import React, { useEffect, useState } from "react";
import { Route, Routes, Link, useLocation, useNavigate } from "react-router-dom";
import CustomerOrder from "./pages/CustomerOrder";
import AdminOrders from "./pages/AdminOrders";
import AdminMenu from "./pages/AdminMenu";
import AdminHome from "./pages/AdminHome";
import AdminTables from "./pages/AdminTables";
import { authMe } from "./api";
import Login from "./pages/Login";
import WaiterDesk from "./pages/WaiterDesk";

export default function App() {
  const location = useLocation();
  const nav = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/a/");
  const isCustomerRoute = location.pathname.startsWith("/c/");

  const [authChecked, setAuthChecked] = useState(false);
  const [defaultSlug, setDefaultSlug] = useState<string | null>(null);

  // Beim Mount Session prüfen
  useEffect(() => {
    (async () => {
      try {
        const me = await authMe();
        // API kann { data: { default_slug } } oder flach { default_slug } liefern
        const slug =
          me?.data?.default_slug ?? me?.default_slug ?? null;
        setDefaultSlug(slug ?? null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  // Öffnet Dashboard mit Session-Slug oder fordert Login an
  async function openDashboard() {
    let slug = defaultSlug;
    if (!slug) {
      const me = await authMe();
      slug = me?.data?.default_slug ?? me?.default_slug ?? null;
      setDefaultSlug(slug ?? null);
    }
    if (!slug) {
      nav("/login");
      return;
    }
    nav(`/a/${slug}/home`);
  }

  // Hilfsfunktion für Admin-Nav-Ziele
  function adminPath(suffix: string) {
    return defaultSlug ? `/a/${defaultSlug}${suffix}` : "#";
  }

  return (
    <div className="min-h-screen">
      {/* Navigation nur für Admin und Home */}
      {!isCustomerRoute && (
        <nav
          className={`sticky top-0 z-50 ${
            isAdminRoute
              ? "bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50"
              : "bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className={`text-xl font-bold ${
                  isAdminRoute ? "text-white" : "text-gray-900"
                }`}
              >
                SmartQR
              </Link>

              {isAdminRoute && (
                <div className="flex items-center space-x-1">
                  <AdminNavLink
                    to={adminPath("/home")}
                    active={location.pathname.includes("/home")}
                    onClickFallback={openDashboard}
                    enabled={!!defaultSlug}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Dashboard
                  </AdminNavLink>

                  <AdminNavLink
                    to={adminPath("/orders")}
                    active={location.pathname.includes("/orders")}
                    onClickFallback={openDashboard}
                    enabled={!!defaultSlug}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Bestellungen
                  </AdminNavLink>

                  <AdminNavLink
                    to={adminPath("/menu")}
                    active={location.pathname.includes("/menu")}
                    onClickFallback={openDashboard}
                    enabled={!!defaultSlug}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Menü
                  </AdminNavLink>

                  <AdminNavLink
                    to={adminPath("/tables")}
                    active={location.pathname.includes("/tables")}
                    onClickFallback={openDashboard}
                    enabled={!!defaultSlug}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Tische
                  </AdminNavLink>
                </div>
              )}

              <div
                className={`text-xs px-3 py-1 rounded-full ${
                  isAdminRoute ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"
                }`}
              >
                SmartQR - v1.0
              </div>
            </div>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Home onOpenDashboard={openDashboard} authChecked={authChecked} />} />
        <Route path="/c/:slug" element={<CustomerOrder />} />
        <Route path="/a/:slug/orders" element={<AdminOrders />} />
        <Route path="/a/:slug/menu" element={<AdminMenu />} />
        <Route path="/a/:slug/home" element={<AdminHome />} />
        <Route path="/a/:slug/tables" element={<AdminTables />} />
        <Route path="/w/:slug" element={<WaiterDesk />} />
        <Route path="/login" element={<Login />} /> 
      </Routes>
    </div>
  );
}

function AdminNavLink({
  to,
  active,
  children,
  onClickFallback,
  enabled,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
  onClickFallback: () => void;
  enabled: boolean;
}) {
  const className = `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
    active ? "bg-emerald-600 text-white shadow-lg" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
  }`;

  // Solange kein defaultSlug vorhanden ist, Button ausgeben, der openDashboard triggert
  if (!enabled || to === "#") {
    return (
      <button onClick={onClickFallback} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function Home({ onOpenDashboard, authChecked }: { onOpenDashboard: () => void; authChecked: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SmartQR
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modernes QR-Code basiertes Bestellsystem für die Gastronomie.
            Digitale Menüs, Live-Bestellungen und professionelles Admin-Dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Für Gäste</h2>
            <p className="text-gray-600 mb-6">
              QR-Code scannen, digital bestellen und bezahlen. Keine App-Installation nötig.
            </p>
            {/* Demo-Link kann bleiben, falls du explizit eine Demo zeigen willst */}
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Demo-Links:</p>
              <Link
                to="/c/demo-restaurant?table=1"
                className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-2xl font-semibold text-center hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105"
              >
                Tisch 1 - Demo bestellen
              </Link>
            </div>
          </div>

          {/* Admin Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant-Admin</h2>
            <p className="text-gray-600 mb-6">
              Bestellungen verwalten, Menü bearbeiten, Tische und QR-Codes erstellen.
            </p>
            <div className="space-y-3">
              <button
                onClick={onOpenDashboard}
                className="block w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-2xl font-semibold text-center transition-all duration-200 hover:scale-105"
                disabled={!authChecked}
              >
                Admin Dashboard öffnen
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Blitzschnell</h3>
            <p className="text-sm text-gray-600">Moderne Performance mit React, Vite und optimiertem Code</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Mobile-First</h3>
            <p className="text-sm text-gray-600">Optimiert für Smartphones und Tablets der Gäste</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Sicher</h3>
            <p className="text-sm text-gray-600">Session-Login oder Admin-Token, sichere API-Calls</p>
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-sm text-gray-500">Entwickelt mit ❤️ für moderne Gastronomie</p>
        </div>
      </div>
    </div>
  );
}
