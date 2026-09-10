import React from 'react';

// Camadas de blobs orgânicos desfocados, evocando luz filtrada pela copa
// da mata — usado como pano de fundo decorativo em telas cheias.
export default function CanopyBackdrop({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -left-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-canopy-600/25 blur-[110px]" />
      <div className="absolute right-[-10rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-sun-500/15 blur-[100px]" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-pantanal-500/15 blur-[120px]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="leafGrid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M60 10 C85 30 90 60 60 110 C30 60 35 30 60 10 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-canopy-200"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#leafGrid)" />
      </svg>
    </div>
  );
}
