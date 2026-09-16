import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import CanopyBackdrop from './decor/CanopyBackdrop.jsx';
import LeafMark from './decor/LeafMark.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha o menu off-canvas automaticamente a cada troca de rota (inclusive
  // quando a navegação acontece por outro meio que não um clique no link).
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-canopy-950">
      <CanopyBackdrop />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra superior visível apenas em telas estreitas — a sidebar
              some do fluxo nesse breakpoint e vira um painel off-canvas. */}
          <header className="flex items-center gap-3 border-b border-canopy-800/60 bg-canopy-950/80 px-4 py-3.5 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-canopy-300 hover:bg-canopy-800/60 hover:text-canopy-50"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <LeafMark className="h-7 w-7" />
            <p className="font-display text-base text-canopy-50">AgroSec</p>
          </header>

          <main className="leaf-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 md:px-10">
            {/* A key trocando por rota reinicia a animação a cada navegação,
                dando uma transição suave sem precisar de uma lib de routing
                animado — desativada automaticamente por prefers-reduced-motion
                via a regra global em index.css. */}
            <div key={pathname} className="mx-auto max-w-6xl animate-fade-slide-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
