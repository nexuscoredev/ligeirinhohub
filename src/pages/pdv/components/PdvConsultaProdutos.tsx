import { useMemo, useState } from 'react';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { ProdutoPdv } from '@/lib/pdv/types';
import { PdvOverlay } from './PdvOverlay';

interface PdvConsultaProdutosProps {
  produtos: ProdutoPdv[];
  precoAtacado: boolean;
  onSelecionar: (produto: ProdutoPdv) => void;
  onFechar: () => void;
}

export function PdvConsultaProdutos({
  produtos,
  precoAtacado,
  onSelecionar,
  onFechar,
}: PdvConsultaProdutosProps) {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q
      ? produtos.filter(
          (p) =>
            p.nome.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.codigo_barras?.toLowerCase().includes(q) ?? false),
        )
      : produtos;
    return base.slice(0, 200);
  }, [produtos, busca]);

  function precoDe(p: ProdutoPdv) {
    return precoAtacado && p.preco_atacado != null ? p.preco_atacado : p.preco_base;
  }

  return (
    <PdvOverlay titulo="Consulta de Produtos" onFechar={onFechar} largura="xl">
      <input
        className="pdv-consulta-busca"
        type="search"
        autoFocus
        placeholder="Buscar por nome, código ou SKU…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <div className="pdv-consulta-tabela-wrap">
        <table className="pdv-consulta-tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Unid.</th>
              <th className="pdv-col-num">Unit. (R$)</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} onClick={() => onSelecionar(p)} tabIndex={0}>
                <td>{p.codigo_barras ?? p.sku}</td>
                <td>{p.nome}</td>
                <td>{p.unidade}</td>
                <td className="pdv-col-num">{formatarMoeda(precoDe(p))}</td>
              </tr>
            ))}
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="pdv-consulta-vazio">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PdvOverlay>
  );
}
