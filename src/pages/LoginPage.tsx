import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { HubLogo } from '@/components/HubLogo';
import { usePerfil } from '@/contexts/PerfilContext';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import './LoginPage.css';

export function LoginPage() {
  const { session, carregando } = usePerfil();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/bem-vindo';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!carregando && session) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    setEnviando(false);
    if (error) {
      setErro(error.message);
    }
  }

  return (
    <div className="login-pagina">
      <div className="login-card card">
        <div className="login-marca">
          <HubLogo size="xl" badgeHub glow />
        </div>
        <span className="hub-tag login-tag">Painel administrativo</span>
        <h1 className="login-titulo">
          Acesso ao <span>Hub</span>
        </h1>
        <p className="login-subtitulo">
          Gestão da adega — venda, operação e entrega em um só lugar.
        </p>

        {!supabaseConfigurado && (
          <p className="login-aviso">
            Configure o arquivo <code>.env</code> com as chaves do Supabase
            (veja <code>.env.example</code>).
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>
          {erro && <p className="erro">{erro}</p>}
          <button
            type="submit"
            className="btn"
            disabled={enviando || !supabaseConfigurado}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
