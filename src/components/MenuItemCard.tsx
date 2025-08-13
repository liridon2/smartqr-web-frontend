// src/components/MenuItemCard.tsx
import type { MenuItem } from "../types";

type Props = { 
  item: MenuItem; 
  onAdd?: (item: MenuItem) => void; 
  disabled?: boolean;
  cartQty?: number;
};

export default function MenuItemCard({ item, onAdd, disabled, cartQty = 0 }: Props) {
  const available = Number(item.is_available) === 1 || item.is_available === true;

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Availability indicator */}
      <div className="absolute top-4 right-4">
        {available ? (
          <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
        ) : (
          <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
            Nicht verfügbar
          </div>
        )}
      </div>

      {/* Cart quantity indicator */}
      {cartQty > 0 && (
        <div className="absolute top-4 left-4 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
          {cartQty}
        </div>
      )}

      {/* Item image placeholder or actual image */}
      <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-indigo-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>

      {/* Item details */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {item.price.toFixed(2)} €
          </div>

          {onAdd && (
            <button
              onClick={() => onAdd(item)}
              disabled={!available || disabled}
              className="group/btn relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Hinzufügen
              </span>
              
              {/* Ripple effect on click */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl scale-0 group-active/btn:scale-100 transition-transform duration-150"></div>
            </button>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}