import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, ErrorBanner } from '../components/ui.jsx';
import LeafMark from '../components/decor/LeafMark.jsx';
import CanopyBackdrop from '../components/decor/CanopyBackdrop.jsx';

const BIOMES = ['Amazônia', 'Mata Atlântica', 'Cerrado', 'Caatinga', 'Pantanal', 'Pampa'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canopy-950 px-4 py-10">
      <CanopyBackdrop />

      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[2rem] border border-canopy-800/50 shadow-canopy md:grid-cols-2">
        {/* Painel ilustrativo */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-canopy-800 via-canopy-900 to-bark-950 p-10 md:flex">
          <div className="absolute inset-0 opacity-40" aria-hidden="true">
            <div className="absolute left-6 top-10 h-40 w-40 rounded-organic bg-canopy-500/30 blur-2xl" />
            <div className="absolute bottom-16 right-4 h-44 w-44 rounded-organic bg-sun-500/20 blur-2xl" />
          </div>
          <div className="relative">
            <LeafMark className="h-12 w-12" />
            <h1 className="mt-6 font-display text-3xl leading-tight text-canopy-50">
              Proteção digital para o campo brasileiro
            </h1>
            <p className="mt-3 text-sm text-canopy-300">
              SIEM-Lite, resiliência offline-first e automação LGPD para cooperativas,
              tradings e propriedades de precisão.
            </p>
          </div>
          <div className="relative">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-canopy-400">
              Biomas monitorados
            </p>
            <div className="flex flex-wrap gap-2">
              {BIOMES.map((biome) => (
                <span
                  key={biome}
                  className="rounded-full border border-canopy-600/40 bg-canopy-950/40 px-3 py-1 text-xs text-canopy-200"
                >
                  {biome}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="glass-panel flex flex-col justify-center p-8 md:p-10">
          <div className="mb-8 md:hidden">
            <LeafMark className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl text-canopy-50">Entrar</h2>
          <p className="mt-1 text-sm text-canopy-400">Acesse o painel de segurança da sua operação.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="E-mail"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@cooperativa.com.br"
            />
            <Input
              label="Senha"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <ErrorBanner message={error} />
            <Button type="submit" variant="sun" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-canopy-400">
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-sun-400 hover:text-sun-300">
              Cadastre sua organização
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
