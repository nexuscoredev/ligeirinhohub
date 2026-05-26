import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { HubLogo } from '@/components/HubLogo';
import { usePerfil } from '@/contexts/PerfilContext';
import { emailParaLogin } from '@/lib/authLogin';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import './LoginPage.css';

export function LoginPage() {
  const { session, usuario: perfil, carregando, erro: erroPerfil } = usePerfil();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/bem-vindo';

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aguardandoPerfil = Boolean(session && !perfil && !erroPerfil);

  if (!carregando && session && perfil) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const emailAuth = await emailParaLogin(usuario);
    if (!emailAuth) {
      setEnviando(false);
      setErro('Usuário ou senha incorretos.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailAuth,
      password: senha,
    });

    setEnviando(false);
    if (error) {
      setErro('Usuário ou senha incorretos.');
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
          Gestão da distribuidora — venda, operação e entrega em um só lugar.
        </p>

        {!supabaseConfigurado && (
          <p className="login-aviso">
            Configure o arquivo <code>.env</code> com as chaves do Supabase
            (veja <code>.env.example</code>).
          </p>
        )}

        {aguardandoPerfil ? (
          <div className="login-aguardando" role="status">
            <p>Preparando seu acesso…</p>
          </div>
        ) : null}

        {erroPerfil && session && !perfil ? (
          <p className="erro">{erroPerfil}</p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} hidden={aguardandoPerfil}>
          <label>
            Usuário
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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
            disabled={enviando || aguardandoPerfil || !supabaseConfigurado}
          >
            {enviando || aguardandoPerfil ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
