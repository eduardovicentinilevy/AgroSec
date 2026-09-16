import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import CanopyBackdrop from '../components/decor/CanopyBackdrop.jsx';
import LeafMark from '../components/decor/LeafMark.jsx';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canopy-950 px-4 py-10">
      <CanopyBackdrop />
      <div className="relative z-10 max-w-md text-center">
        <LeafMark className="mx-auto h-12 w-12" />
        <p className="mt-6 font-display text-7xl text-canopy-50">404</p>
        <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-sun-300">
          <Compass className="h-4 w-4" />
          <p className="kicker text-sun-400">Fora da trilha</p>
        </div>
        <h1 className="mt-3 font-display text-2xl text-canopy-50">Essa página se perdeu na mata</h1>
        <p className="mt-2 text-sm text-canopy-400">
          O caminho que você seguiu não leva a nenhum talhão monitorado pelo AgroSec.
        </p>
        <Link to="/">
          <Button variant="sun" className="mt-6">
            Voltar à visão geral
          </Button>
        </Link>
      </div>
    </div>
  );
}
