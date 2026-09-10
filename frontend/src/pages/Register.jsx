import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Select, ErrorBanner } from '../components/ui.jsx';
import LeafMark from '../components/decor/LeafMark.jsx';
import CanopyBackdrop from '../components/decor/CanopyBackdrop.jsx';

const SEGMENTS = [
  { value: 'cooperativa_trading', label: 'Cooperativa / Trading' },
  { value: 'propriedade_precisao', label: 'Propriedade de agricultura de precisão' },
  { value: 'agtech_parceira', label: 'AgTech parceira / fabricante' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgName: '',
    orgSegment: 'propriedade_precisao',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
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

      <div className="relative z-10 w-full max-w-lg glass-panel rounded-[2rem] p-8 md:p-10">
        <div className="flex items-center gap-3">
          <LeafMark className="h-10 w-10" />
          <div>
            <h2 className="font-display text-2xl text-canopy-50">Cadastre sua organização</h2>
            <p className="text-sm text-canopy-400">Comece a monitorar sua operação agroindustrial.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Input
            label="Nome da organização"
            required
            value={form.orgName}
            onChange={update('orgName')}
            placeholder="Cooperativa Vale Verde"
          />
          <Select label="Segmento" value={form.orgSegment} onChange={update('orgSegment')}>
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Input
            label="Seu nome"
            required
            value={form.name}
            onChange={update('name')}
            placeholder="Ana Silva"
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            placeholder="voce@cooperativa.com.br"
          />
          <Input
            label="Senha"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={update('password')}
            placeholder="Mínimo 6 caracteres"
          />
          <ErrorBanner message={error} />
          <Button type="submit" variant="sun" className="w-full" disabled={loading}>
            <Sprout className="h-4 w-4" />
            {loading ? 'Criando...' : 'Criar organização'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-canopy-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-sun-400 hover:text-sun-300">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
