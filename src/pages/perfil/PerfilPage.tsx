import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageShell } from '@/components/PageShell';
import { HubAvatar } from '@/components/HubAvatar';
import { TemaToggle } from '@/components/TemaToggle';
import { usePerfil } from '@/contexts/PerfilContext';
import { appDisplayVersion } from '@/lib/appDisplayVersion';
import {
  alterarMinhaSenha,
  atualizarMeuPerfil,
  enviarAvatar,
  removerAvatar,
} from '@/lib/perfil/api';
import './perfil.css';

export function PerfilPage() {
  const { usuario, recarregarPerfil } = usePerfil();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirma, setSenhaConfirma] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    setNome(usuario.nome);
    setBio(usuario.bio ?? '');
    setTelefone(usuario.telefone ?? '');
  }, [usuario]);

  if (!usuario) return null;

  const perfil = usuario;

  async function recarregar() {
    await recarregarPerfil();
  }

  async function handleSalvarDados(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (!nome.trim()) {
      setErro('Informe seu nome de exibição.');
      return;
    }
    setSalvando(true);
    const { error } = await atualizarMeuPerfil(perfil.id, {
      nome: nome.trim(),
      bio,
      telefone,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Dados salvos com sucesso.');
    await recarregar();
  }

  async function handleFoto(file: File) {
    setErro(null);
    setMsg(null);
    setEnviandoFoto(true);
    const { error } = await enviarAvatar(perfil.id, file);
    setEnviandoFoto(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Foto atualizada.');
    await recarregar();
  }

  async function handleRemoverFoto() {
    setErro(null);
    setMsg(null);
    setEnviandoFoto(true);
    const { error } = await removerAvatar(perfil.id);
    setEnviandoFoto(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Foto removida.');
    await recarregar();
  }

  async function handleAlterarSenha(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== senhaConfirma) {
      setErro('As senhas não coincidem.');
      return;
    }
    setSalvando(true);
    const { error } = await alterarMinhaSenha(senha);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSenha('');
    setSenhaConfirma('');
    setMsg('Senha alterada com sucesso.');
  }

  const membroDesde = new Date(perfil.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageShell
      className="hub-page--denso perfil-page"
      tag="Conta"
      titulo="Meu perfil"
      subtitulo="Personalize sua presença no Hub e gerencie preferências da conta."
    >
      {erro ? <p className="erro perfil-feedback">{erro}</p> : null}
      {msg ? <p className="perfil-sucesso perfil-feedback">{msg}</p> : null}

      <section className="perfil-hero card">
        <div className="perfil-hero__foto">
          <HubAvatar nome={perfil.nome} avatarUrl={perfil.avatar_url} size="xl" />
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="perfil-foto-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFoto(file);
              e.target.value = '';
            }}
          />
          <div className="perfil-hero__acoes-foto">
            <button
              type="button"
              className="btn btn-secundario"
              disabled={enviandoFoto}
              onClick={() => inputFotoRef.current?.click()}
            >
              {enviandoFoto ? 'Enviando…' : 'Alterar foto'}
            </button>
            {perfil.avatar_url ? (
              <button
                type="button"
                className="btn btn-secundario"
                disabled={enviandoFoto}
                onClick={() => void handleRemoverFoto()}
              >
                Remover
              </button>
            ) : null}
          </div>
        </div>
        <div className="perfil-hero__info">
          <h2 className="perfil-hero__nome">{perfil.nome}</h2>
          <p className="perfil-hero__cargo">{perfil.cargo}</p>
          <p className="perfil-hero__meta">
            <span>{perfil.email}</span>
            <span className="perfil-hero__sep">·</span>
            <span>Membro desde {membroDesde}</span>
          </p>
          {perfil.bio ? <p className="perfil-hero__bio">{perfil.bio}</p> : null}
        </div>
      </section>

      <div className="perfil-grid">
        <form className="perfil-card card" onSubmit={(e) => void handleSalvarDados(e)}>
          <h3 className="perfil-card__titulo">Dados pessoais</h3>
          <p className="perfil-card__sub">Como você aparece para o time no chat e no menu.</p>

          <label className="perfil-campo">
            Nome de exibição
            <input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={80} />
          </label>

          <label className="perfil-campo">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Uma linha sobre você (opcional)"
            />
          </label>

          <label className="perfil-campo">
            Telefone
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={20}
            />
          </label>

          <button type="submit" className="btn" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar dados'}
          </button>
        </form>

        <div className="perfil-coluna">
          <section className="perfil-card card">
            <h3 className="perfil-card__titulo">Conta</h3>
            <dl className="perfil-dl">
              <div>
                <dt>Login</dt>
                <dd>{perfil.login}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{perfil.email}</dd>
              </div>
              <div>
                <dt>Cargo</dt>
                <dd>
                  <span className="perfil-badge">{perfil.cargo}</span>
                </dd>
              </div>
            </dl>
            <p className="perfil-card__hint">
              Login, e-mail e cargo são gerenciados pelo administrador do Hub.
            </p>
          </section>

          <section className="perfil-card card">
            <h3 className="perfil-card__titulo">Aparência</h3>
            <p className="perfil-card__sub">Tema da interface em todos os dispositivos.</p>
            <TemaToggle />
          </section>

          <form className="perfil-card card" onSubmit={(e) => void handleAlterarSenha(e)}>
            <h3 className="perfil-card__titulo">Segurança</h3>
            <p className="perfil-card__sub">Altere a senha de acesso ao Hub.</p>

            <label className="perfil-campo">
              Nova senha
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </label>

            <label className="perfil-campo">
              Confirmar nova senha
              <input
                type="password"
                value={senhaConfirma}
                onChange={(e) => setSenhaConfirma(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </label>

            <button type="submit" className="btn btn-secundario" disabled={salvando || !senha}>
              Atualizar senha
            </button>
          </form>

          <section className="perfil-card card perfil-card--muted">
            <h3 className="perfil-card__titulo">Sobre o Hub</h3>
            <p className="perfil-versao">{appDisplayVersion()}</p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
