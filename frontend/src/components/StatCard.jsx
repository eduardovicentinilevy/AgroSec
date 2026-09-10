import React from 'react';
import { Card } from './ui.jsx';

export default function StatCard({ icon: Icon, label, value, accent = 'canopy', hint }) {
  const accents = {
    canopy: 'text-canopy-300 bg-canopy-600/15',
    sun: 'text-sun-300 bg-sun-500/15',
    caatinga: 'text-caatinga-400 bg-caatinga-600/15',
    pantanal: 'text-pantanal-400 bg-pantanal-500/15',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-organic bg-canopy-600/10" aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-canopy-400">{label}</p>
          <p className="mt-2 font-display text-3xl text-canopy-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-canopy-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={`rounded-2xl p-2.5 ${accents[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
