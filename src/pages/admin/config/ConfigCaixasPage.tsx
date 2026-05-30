import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { listarCaixasConfig, salvarCaixaConfig } from '@/lib/config/api';
import type { CaixaConfig } from '@/types/config';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './config.css';

export function ConfigCaixasPage() {
  const [caixas, setCaixas] = useState<CaixaConfig[]>([]);
  const [form, setForm] = useState({ numero: '', nome: '', descricao: '' });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { caixas: lista, error } = await listarCaixasConfig();
    if (error) setErro(error.message);
    else setCaixas(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const adicionar = async () => {
    const numero = Number(form.numero);
    if (!numero || numero < 1) {
      setErro('Informe um número de caixa válido.');
      return;
    }
    if (!form.nome.trim()) {
      setErro('Informe o nome do caixa.');
      return;
    }
    setSalvando(true);
    setErro(null);
    const { error } = await salvarCaixaConfig({
      numero,
      nome: form.nome,
      descricao: form.descricao || null,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else {
      setMsg('Caixa registrado.');
      setForm({ numero: '', nome: '', descricao: '' });
      void carregar();
    }
  };

  const toggleAtivo = async (c: CaixaConfig) => {
    const { error } = await salvarCaixaConfig({
      id: c.id,
      numero: c.numero,
      nome: c.nome,
      descricao: c.descricao,
      ativo: !c.ativo,
    });
    if (error) setErro(error.message);
    else void carregar();
  };

  return (
    <PageShell
      className="hub-page--denso"
      tag="Configuração"
      titulo={
        <>
          Caixas <span>PDV</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <p className="cfg-voltar">
        <Link to="/admin/config">← Voltar à configuração</Link>
      </p>

      {erro ? (
        <p className="cfg-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="cfg-msg">{msg}</p> : null}

      <div className="cfg-form">
        <h2 style={{ margin: 0, fontSize: '0.95rem' }}>Novo caixa</h2>
        <div className="cfg-grid-2">
          <label>
            Número
            <input
              type="number"
              min={1}
              value={form.numero}
              onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
            />
          </label>
          <label>
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Caixa 02"
            />
          </label>
        </div>
        <label>
          Descrição
          <input
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
        </label>
        <button type="button" className="btn" disabled={salvando} onClick={() => void adicionar()}>
          {salvando ? 'Salvando…' : 'Adicionar caixa'}
        </button>
      </div>

      <section className="cfg-page" style={{ marginTop: '1.5rem' }} aria-busy={carregando}>
        <h2 style={{ margin: 0, fontSize: '0.95rem' }}>Caixas registrados</h2>
        <table className="cfg-tabela">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ativo</th>
            </tr>
          </thead>
          <tbody>
            {caixas.map((c) => (
              <tr key={c.id}>
                <td>{c.numero}</td>
                <td>{c.nome}</td>
                <td>{c.descricao ?? '—'}</td>
                <td>
                  <button type="button" className="btn btn-secundario" onClick={() => void toggleAtivo(c)}>
                    {c.ativo ? 'Sim' : 'Não'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  );
}
