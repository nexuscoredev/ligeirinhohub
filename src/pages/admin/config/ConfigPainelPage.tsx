import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './config.css';

const MODULOS = [
  {
    rota: '/admin/config/empresa',
    titulo: 'Empresa',
    descricao: 'Razão social, CNPJ e regime tributário',
    icone: '🏢',
  },
  {
    rota: '/admin/config/caixas',
    titulo: 'Caixas PDV',
    descricao: 'Terminais de caixa registrados',
    icone: '🛒',
  },
  {
    rota: '/admin/config/fiscal',
    titulo: 'Fiscal / XML',
    descricao: 'Ambiente, certificado e envio de XML',
    icone: '🧾',
  },
] as const;

export function ConfigPainelPage() {
  return (
    <PageShell
      className="hub-page--denso"
      tag="Configuração"
      titulo={
        <>
          Configuração <span>avançada</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        Caixas, dados da empresa e parâmetros fiscais (Gestão Fácil).
      </p>

      <div className="cfg-cards">
        {MODULOS.map((m) => (
          <Link key={m.rota} to={m.rota} className="cfg-card">
            <span aria-hidden>{m.icone}</span>
            <strong>{m.titulo}</strong>
            <span>{m.descricao}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
