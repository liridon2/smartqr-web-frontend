import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin } from "../api";

// Animated Background for Login
const LoginBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Floating icons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl opacity-10 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        >
          {['🔐', '🚀', '⚡', '💎', '🌟', '🔥', '✨', '🎯'][i]}
        </div>
      ))}
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="loginGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3b82f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginGrid)" />
        </svg>
      </div>
    </div>
  );
};

// Floating Label Input Component
const FloatingInput = ({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  required, 
  icon,
  error 
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  icon: React.ReactNode;
  error?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const hasValue = value.length > 0;
  const isActive = focused || hasValue;

  return (
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 ${
        isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-300'
      }`}>
        {icon}
      </div>
      
      <input
        type={type === 'password' && showPassword ? 'text' : type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className={`w-full bg-slate-900/50 backdrop-blur-sm border rounded-2xl pl-12 pr-12 py-4 text-white placeholder-transparent focus:outline-none transition-all duration-300 ${
          error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
            : 'border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-500/70'
        }`}
        placeholder={placeholder}
      />
      
      {/* Floating Label */}
      <label className={`absolute left-12 transition-all duration-300 pointer-events-none ${
        isActive 
          ? 'top-2 text-xs text-blue-400 font-medium' 
          : 'top-1/2 transform -translate-y-1/2 text-slate-400'
      }`}>
        {placeholder}
      </label>
      
      {/* Password Toggle */}
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L18.5 21.5m-7.622-7.622L8.464 8.464m1.414 1.414l2.122 2.122" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm animate-slideInUp">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

// Loading Button Component
const LoadingButton = ({ loading, children, ...props }: {
  loading: boolean;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/25 transform ${
        loading ? 'cursor-wait' : ''
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Anmeldung...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Success Animation Component
const SuccessAnimation = () => {
  return (
    <div className="fixed inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center animate-scaleIn">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Anmeldung erfolgreich!</h3>
        <p className="text-slate-600">Weiterleitung zum Dashboard...</p>
      </div>
    </div>
  );
};

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form validation
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Clear errors when user starts typing
    if (email && emailError) setEmailError("");
    if (password && passwordError) setPasswordError("");
    if (err) setErr(null);
  }, [email, password]);

  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError("E-Mail ist erforderlich");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Ungültige E-Mail-Adresse");
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      setPasswordError("Passwort ist erforderlich");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Passwort muss mindestens 6 Zeichen haben");
      isValid = false;
    }
    
    return isValid;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setErr(null); 
    setBusy(true);
    
    try {
      const res = await authLogin(email, password);
      const slug = res?.data?.default_slug ?? res?.default_slug;
      
      if (!slug) throw new Error("Kein Restaurant zugeordnet.");
      
      // Show success animation
      setShowSuccess(true);
      
      // Navigate after animation
      setTimeout(() => {
        nav(`/a/${slug}/home`);
      }, 2000);
      
    } catch (e: any) {
      setErr(e.message || "Login fehlgeschlagen");
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <LoginBackground />
      
      {/* Success Animation */}
      {showSuccess && <SuccessAnimation />}
      
      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fadeInDown">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent mb-2">
            SmartQR Admin
          </h1>
          <p className="text-slate-400">Melde dich an um fortzufahren</p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl animate-fadeInUp">
          <div className="space-y-6">
            {/* Email Input */}
            <FloatingInput
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              required
              error={emailError}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            {/* Password Input */}
            <FloatingInput
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              required
              error={passwordError}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    rememberMe 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  Angemeldet bleiben
                </span>
              </label>
              
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>

            {/* Global Error */}
            {err && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-slideInUp">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-red-300 font-medium text-sm">Anmeldung fehlgeschlagen</h4>
                    <p className="text-red-400 text-sm">{err}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <LoadingButton loading={busy} type="submit">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Anmelden
              </span>
            </LoadingButton>
          </div>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-8 animate-fadeInUp animation-delay-200">
          <p className="text-slate-500 text-sm">
            Noch kein Account?{" "}
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              Registrieren
            </button>
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
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
          
          .animate-fadeInDown {
            animation: fadeInDown 0.8s ease-out forwards;
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
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
          
          .animation-delay-200 {
            animation-delay: 200ms;
          }
        `
      }} />
    </div>
  );
}