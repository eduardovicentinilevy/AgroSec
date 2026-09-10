import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ variant = 'primary', className = '', children, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-br from-canopy-500 to-canopy-700 text-white shadow-lg shadow-canopy-900/40 hover:from-canopy-400 hover:to-canopy-600 active:scale-[0.98]',
    sun: 'bg-gradient-to-br from-sun-400 to-sun-600 text-bark-950 shadow-lg shadow-sun-900/30 hover:from-sun-300 hover:to-sun-500 active:scale-[0.98]',
    ghost: 'bg-canopy-800/50 text-canopy-100 border border-canopy-700/60 hover:bg-canopy-800 active:scale-[0.98]',
    danger: 'bg-caatinga-600/90 text-white hover:bg-caatinga-500 active:scale-[0.98]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Card({ className = '', children }) {
  return <div className={`glass-panel rounded-3xl p-6 ${className}`}>{children}</div>;
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-canopy-300">{label}</span>}
      <input
        className={`w-full rounded-xl border border-canopy-700/50 bg-canopy-950/60 px-3.5 py-2.5 text-sm text-canopy-50 placeholder:text-canopy-500 outline-none transition focus:border-sun-400 focus:ring-2 focus:ring-sun-400/30 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-canopy-300">{label}</span>}
      <select
        className={`w-full rounded-xl border border-canopy-700/50 bg-canopy-950/60 px-3.5 py-2.5 text-sm text-canopy-50 outline-none transition focus:border-sun-400 focus:ring-2 focus:ring-sun-400/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-canopy-300 ${className}`} />;
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-canopy-700/50 py-16 text-center">
      {Icon && <Icon className="h-10 w-10 text-canopy-600" />}
      <p className="font-display text-lg text-canopy-100">{title}</p>
      {description && <p className="max-w-sm text-sm text-canopy-400">{description}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-canopy">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl text-canopy-50">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-canopy-300 hover:bg-canopy-800 hover:text-canopy-50"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-caatinga-600/50 bg-caatinga-600/10 px-4 py-3 text-sm text-caatinga-400">
      {message}
    </div>
  );
}
