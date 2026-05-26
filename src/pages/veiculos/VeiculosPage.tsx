import { useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { criarVeiculo, importarVeiculos, listarVeiculos } from '@/lib/veiculos/api';
import type { Veiculo } from '@/types/veiculos';
import '../operacional/operacional.css';

function podeEditarVeiculos(cargo?: string) {
  return ['Desenvolvedor', 'Administrador', 'Gerente', 'Logistica'].includes(String(cargo));
}

function parseImportVeiculos(raw: string) {
  const linhas = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return linhas
    .map((line) => {
      const cols = line.includes(';')
        ? line.split(';')
        : line.includes('\t')
          ? line.split('\t')
          : line.split(',');
      const [nome, placa, tipo, capacidade] = cols.map((c) => c.trim());
      return { nome, placa, tipo, capacidade_kg: capacidade };
    })
    .filter((l) => l.nome);
}

export function VeiculosPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [importAberto, setImportAberto] = useState(false);

  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [importRaw, setImportRaw] = useState('');

  const carregar = () =>
    void listarVeiculos().then(({ veiculos: lista, error }) => {
      if (error) setErro(error.message);
      else setVeiculos(lista);
    });

  useEffect(() => {
    carregar();
  }, []);

  if (!app) return null;
  const item = itemAppPorRota(app, '/veiculos');
  const podeEditar = podeEditarVeiculos(usuario?.cargo);
  const previewImport = useMemo(() => parseImportVeiculos(importRaw), [importRaw]);

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Veículos"
      subtitulo="Cadastro de caminhões e frota para a operação."
    >
      <div className="ops-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {podeEditar ? (
            <>
              <button type="button" className="btn" onClick={() => setNovoAberto(true)}>
                Novo veículo
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setImportAberto(true)}
              >
                Importar base
              </button>
            </>
          ) : null}
        </div>
      </div>

      {erro ? <p className="erro">{erro}</p> : null}
      {sucesso ? (
        <p className="ops-resumo" role="status">
          {sucesso}
        </p>
      ) : null}

      {novoAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setNovoAberto(false)}>
          <div className="ops-modal card" role="dialog" aria-labelledby="vei-novo" onClick={(e) => e.stopPropagation()}>
            <h3 id="vei-novo" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
              Novo veículo
            </h3>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ marginTop: '0.25rem' }} />
            </label>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', flex: 1, minWidth: 140 }}>
                Placa
                <input
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Opcional"
                  style={{ marginTop: '0.25rem' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', flex: 1, minWidth: 140 }}>
                Tipo
                <input
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="Ex.: Caminhão 3/4"
                  style={{ marginTop: '0.25rem' }}
                />
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Capacidade (kg)
              <input
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                placeholder="Opcional"
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setErro(null);
                  setSucesso(null);
                  void criarVeiculo({
                    nome,
                    placa,
                    tipo,
                    capacidadeKg: capacidade === '' ? null : Number(capacidade),
                  }).then(({ error }) => {
                    if (error) {
                      setErro(error.message);
                      return;
                    }
                    setNovoAberto(false);
                    setNome('');
                    setPlaca('');
                    setTipo('');
                    setCapacidade('');
                    setSucesso('Veículo criado com sucesso.');
                    carregar();
                  });
                }}
              >
                Criar
              </button>
              <button type="button" className="btn btn-secundario" onClick={() => setNovoAberto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setImportAberto(false)}>
          <div className="ops-modal card" role="dialog" aria-labelledby="vei-import" onClick={(e) => e.stopPropagation()}>
            <h3 id="vei-import" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
              Importar base de veículos
            </h3>
            <p style={{ margin: '0 0 0.65rem', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
              Cole linhas no formato: <code>nome;placa;tipo;capacidade_kg</code>
            </p>
            <textarea
              rows={7}
              value={importRaw}
              onChange={(e) => setImportRaw(e.target.value)}
              placeholder="Ex.:\nCaminhão 01;ABC-1D23;3/4;3500\nFiorino 02;DEF-4G56;Fiorino;650"
            />
            <p style={{ margin: '0.6rem 0 0', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
              Prévia: <strong>{previewImport.length}</strong> veículo(s)
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setErro(null);
                  setSucesso(null);
                  void importarVeiculos(previewImport).then(({ inseridos, error }) => {
                    if (error) {
                      setErro(error.message);
                      return;
                    }
                    setImportAberto(false);
                    setImportRaw('');
                    setSucesso(`${inseridos} veículo(s) importado(s).`);
                    carregar();
                  });
                }}
                disabled={previewImport.length === 0}
              >
                Importar
              </button>
              <button type="button" className="btn btn-secundario" onClick={() => setImportAberto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="hub-grid-2">
        {veiculos.length === 0 ? (
          <p className="card">Nenhum veículo cadastrado.</p>
        ) : (
          veiculos.map((v) => (
            <article key={v.id} className="card">
              <strong>{v.nome}</strong>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--hub-muted)' }}>
                {v.placa ? `Placa: ${v.placa}` : 'Sem placa'}
                {v.tipo ? ` · ${v.tipo}` : ''}
                {v.capacidade_kg != null ? ` · ${v.capacidade_kg}kg` : ''}
              </p>
            </article>
          ))
        )}
      </div>
    </AppPageHeader>
  );
}

