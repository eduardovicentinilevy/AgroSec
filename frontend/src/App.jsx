import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Nodes from './pages/Nodes.jsx';
import Alerts from './pages/Alerts.jsx';
import Iocs from './pages/Iocs.jsx';
import Lgpd from './pages/Lgpd.jsx';
import Events from './pages/Events.jsx';
import Team from './pages/Team.jsx';
import Subscription from './pages/Subscription.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={session ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="nos" element={<Nodes />} />
        <Route path="alertas" element={<Alerts />} />
        <Route path="iocs" element={<Iocs />} />
        <Route path="eventos" element={<Events />} />
        <Route path="lgpd" element={<Lgpd />} />
        <Route path="equipe" element={<Team />} />
        <Route path="plano" element={<Subscription />} />
        <Route path="configuracoes" element={<Settings />} />
        {/* Cobre qualquer sub-rota não reconhecida; usuários sem sessão nem
            chegam a renderizar isso, pois ProtectedRoute já redireciona ao
            /login antes de decidir qual rota filha corresponde. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
