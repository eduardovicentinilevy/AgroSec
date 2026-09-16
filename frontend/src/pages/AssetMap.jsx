import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, Radio } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, EmptyState, Spinner } from '../components/ui.jsx';
import { NODE_TYPE_LABELS } from '../components/badges.jsx';

const STATUS_DOT = {
  online: 'bg-canopy-400 shadow-[0_0_0_4px_rgba(72,191,135,0.25)]',
  isolated: 'bg-caatinga-500 shadow-[0_0_0_4px_rgba(201,89,47,0.25)]',
  offline: 'bg-bark-400 shadow-[0_0_0_4px_rgba(188,163,116,0.2)]',
};

// Projeta coordenadas geográficas reais numa tela relativa (0-100%) usando
// a própria extensão dos nós cadastrados como referência — não depende de
// tiles externos, então funciona offline e mantém a identidade visual do
// produto em vez de um mapa genérico.
function projectNodes(nodes) {
  const withCoords = nodes.filter((n) => n.latitude != null && n.longitude != null);
  if (withCoords.length === 0) return [];

  const lats = withCoords.map((n) => Number(n.latitude));
  const lngs = withCoords.map((n) => Number(n.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  return withCoords.map((n) => {
    const x = ((Number(n.longitude) - minLng) / lngSpan) * 80 + 10;
    const y = (1 - (Number(n.latitude) - minLat) / latSpan) * 80 + 10;
    return { ...n, x, y };
  });
}

export default function AssetMap() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    api
      .listNodes()
      .then(setNodes)
      .catch((err) => console.error('Falha ao carregar nós:', err))
      .finally(() => setLoading(false));
  }, []);

  const projected = useMemo(() => projectNodes(nodes), [nodes]);
  const withoutCoords = nodes.filter((n) => n.latitude == null || n.longitude == null);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Geolocalização</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">Mapa de ativos</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Posicionamento relativo dos nós dentro da propriedade, a partir das coordenadas
          informadas no cadastro — útil para visualizar rapidamente onde um alerta crítico
          está fisicamente localizado.
        </p>
      </header>

      {projected.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="Nenhum nó com localização definida"
          description='Adicione latitude/longitude ao cadastrar um nó em "Nós operacionais" para vê-lo aqui.'
        />
      ) : (
        <Card className="relative overflow-hidden p-0">
          <div className="relative aspect-[16/10] w-full">
            <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mapGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" className="text-canopy-200" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>

            {projected.map((node) => (
              <Link
                key={node.id}
                to="/nos"
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={`block h-3.5 w-3.5 rounded-full ${STATUS_DOT[node.status] || STATUS_DOT.offline} transition-transform group-hover:scale-125`} />
                <span
                  className={`pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-canopy-700/60 bg-canopy-950/95 px-2.5 py-1.5 text-xs text-canopy-100 shadow-canopy transition-opacity ${
                    hovered === node.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="font-medium text-canopy-50">{node.name}</span>
                  <br />
                  <span className="text-canopy-400">{NODE_TYPE_LABELS[node.node_type] || node.node_type}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-canopy-800/60 px-5 py-3.5">
            {Object.entries({ online: 'Online', isolated: 'Isolado', offline: 'Offline' }).map(([key, label]) => (
              <span key={key} className="flex items-center gap-2 text-xs text-canopy-400">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[key]}`} />
                {label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {withoutCoords.length > 0 && (
        <Card>
          <h3 className="flex items-center gap-2 font-display text-base text-canopy-50">
            <Radio className="h-4 w-4 text-canopy-400" /> Nós sem localização definida
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {withoutCoords.map((n) => (
              <span key={n.id} className="rounded-full bg-canopy-900/60 px-3 py-1.5 text-xs text-canopy-300">
                {n.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
