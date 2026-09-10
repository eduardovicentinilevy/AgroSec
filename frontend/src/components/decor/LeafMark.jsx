import React from 'react';

// Marca/logo em formato de folha estilizada com nervura central,
// usada no topo da sidebar e nas telas de autenticação.
export default function LeafMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="leafGradient" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7bdaa9" />
          <stop offset="0.55" stopColor="#26a36c" />
          <stop offset="1" stopColor="#146848" />
        </linearGradient>
      </defs>
      <path
        d="M8 40C6 24 12 10 34 6C42 20 40 38 24 42C18 43.5 12 43 8 40Z"
        fill="url(#leafGradient)"
      />
      <path
        d="M10 38C16 26 22 16 33 8"
        stroke="#eefbf3"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
