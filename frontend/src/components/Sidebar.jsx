import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  ShieldAlert,
  Fingerprint,
  ScrollText,
  Activity,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  X,
} from 'lucide-react';
import LeafMark from './decor/LeafMark.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MONITORING_ITEMS = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/nos', label: 'Nós operacionais', icon: Radio },
  { to: '/alertas', label: 'Alertas SIEM-Lite', icon: ShieldAlert },
  { to: '/iocs', label: 'Indicadores (IoCs)', icon: Fingerprint },
  { to: '/eventos', label: 'Eventos', icon: Activity },
  { to: '/lgpd', label: 'LGPD & Privacidade', icon: ScrollText },
];

const ORG_ITEMS = [
  { to: '/equipe', label: 'Equipe', icon: Users },
  { to: '/plano', label: 'Plano & Faturamento', icon: CreditCard },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

const BIOMES = ['Amazônia', 'Mata Atlântica', 'Cerrado', 'Caatinga', 'Pantanal', 'Pampa'];

function NavGroup({ items, onNavigate }) {
  return (
    <div className="space-y-1.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gradient-to-r from-canopy-600/40 to-canopy-700/10 text-canopy-50 shadow-inner'
                : 'text-canopy-300 hover:bg-canopy-800/50 hover:text-canopy-50'
            }`
          }
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </NavLink>
      ))}
    </div>
  );
}

// Em telas estreitas a sidebar vira um painel off-canvas controlado por
// `open`/`onClose` (acionado pelo botão hambúrguer no Layout); em md+ ela
// volta a ser estática, sempre visível, ignorando esse estado.
export default function Sidebar({ open = false, onClose }) {
  const { session, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-bark-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 transform flex-col border-r border-canopy-800/60 bg-canopy-950 px-5 py-6 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 md:bg-canopy-950/80 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-1">
          <LeafMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight text-canopy-50">AgroSec</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-canopy-400">Edge &amp; Cloud</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-canopy-400 hover:bg-canopy-800/60 hover:text-canopy-50 md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="leaf-scrollbar mt-8 flex-1 space-y-6 overflow-y-auto">
          <NavGroup items={MONITORING_ITEMS} onNavigate={onClose} />
          <div>
            <p className="mb-2 px-3.5 text-[10px] font-medium uppercase tracking-[0.18em] text-canopy-600">
              Organização
            </p>
            <NavGroup items={ORG_ITEMS} onNavigate={onClose} />
          </div>
        </nav>

        <div className="mt-6 rounded-2xl border border-canopy-800/60 bg-canopy-900/40 p-3.5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-canopy-500">
            Biomas monitorados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BIOMES.map((biome) => (
              <span
                key={biome}
                className="rounded-full bg-canopy-800/60 px-2 py-1 text-[10px] font-medium text-canopy-300"
              >
                {biome}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-canopy-900/50 p-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-canopy-50">{session?.user?.name}</p>
            <p className="truncate text-xs text-canopy-400">{session?.user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-canopy-400 hover:bg-caatinga-600/20 hover:text-caatinga-400"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
