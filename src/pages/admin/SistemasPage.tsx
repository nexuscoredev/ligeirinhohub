import { useCallback, useEffect, useState } from 'react';
import { SistemaStatusBadge } from '@/components/SistemaStatusBadge';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  carregarStatusSistemas,
  urlCatalogoExibicao,
  type StatusSistema,
} from '@/lib/sistemas/status';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

export function SistemasPage() {
  const { session } = usePerfil();
  const [sistemas, setSistemas] = useState<StatusSistema[]>([]);
  const [carregando, setCarregando] = useState(true);

  const atualizar = useCallback(async () => {
    setCarregando(true);
    const lista = await carregarStatusSistemas(session);
    setSistemas(lista);
    setCarregando(false);
  }, [session]);

  useEffect(() => {
    void atualizar();
  }, [atualizar]);

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo={
        <>
          Status dos <span>sistemas</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
      acoes={
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => void atualizar()}
          disabled={carregando}
        >
          {carregando ? 'Verificando…' : 'Atualizar'}
        </button>
      }
    >
      <AdminSubnav />

      <section aria-labelledby="admin-sistemas-titulo">
        <div className="hub-secao-header">
          <h2 id="admin-sistemas-titulo" className="hub-secao-titulo">
            Integrações <span>em uso</span>
          </h2>
        </div>

        {carregando && sistemas.length === 0 ? (
          <p className="card" style={{ fontSize: '0.85rem' }}>
            Verificando integrações…
          </p>
        ) : (
          <div className="admin-sistemas-lista">
            {sistemas.map((s) => (
              <SistemaStatusBadge
                key={s.id}
                nome={s.nome}
                label={s.label}
                ok={s.ok}
              />
            ))}
          </div>
        )}

        <p className="card admin-sistemas-nota">
          Catálogo legado: <code>{urlCatalogoExibicao()}</code>
        </p>
      </section>
    </PageShell>
  );
}
