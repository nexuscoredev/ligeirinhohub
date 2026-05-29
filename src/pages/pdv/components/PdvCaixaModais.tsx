import { useState } from 'react';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { CaixaMovimentoTipo } from '@/lib/pdv/types';
import { PdvOverlay } from './PdvOverlay';

export function PdvAbrirCaixaModal({
  enviando,
  onAbrir,
  onFechar,
}: {
  enviando: boolean;
  onAbrir: (valorAbertura: number) => void;
  onFechar: () => void;
}) {
  const [valor, setValor] = useState('');
  return (
    <PdvOverlay titulo="Abrir caixa" onFechar={onFechar} largura="md">
      <p className="pdv-overlay__hint">
        Informe o valor inicial em dinheiro (fundo de troco) para abrir o turno.
      </p>
      <label className="pdv-campo">
        <span>Valor de abertura</span>
        <input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </label>
      <div className="pdv-pag-acoes">
        <button type="button" className="pdv-btn-secundario" onClick={onFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="pdv-btn-primario"
          disabled={enviando}
          onClick={() => onAbrir(Number(valor) || 0)}
        >
          {enviando ? 'Abrindo…' : 'Abrir caixa'}
        </button>
      </div>
    </PdvOverlay>
  );
}

export function PdvMovimentoModal({
  tipo,
  enviando,
  onRegistrar,
  onFechar,
}: {
  tipo: Extract<CaixaMovimentoTipo, 'sangria' | 'suprimento'>;
  enviando: boolean;
  onRegistrar: (valor: number, motivo: string) => void;
  onFechar: () => void;
}) {
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const titulo = tipo === 'sangria' ? 'Sangria (retirada)' : 'Suprimento (entrada)';
  return (
    <PdvOverlay titulo={titulo} onFechar={onFechar} largura="md">
      <p className="pdv-overlay__hint">
        {tipo === 'sangria'
          ? 'Retirada de dinheiro do caixa (ex.: depósito, despesa).'
          : 'Entrada de dinheiro no caixa (ex.: reforço de troco).'}
      </p>
      <label className="pdv-campo">
        <span>Valor</span>
        <input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </label>
      <label className="pdv-campo">
        <span>Motivo</span>
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Opcional"
        />
      </label>
      <div className="pdv-pag-acoes">
        <button type="button" className="pdv-btn-secundario" onClick={onFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="pdv-btn-primario"
          disabled={enviando || !valor}
          onClick={() => onRegistrar(Number(valor) || 0, motivo.trim())}
        >
          {enviando ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </PdvOverlay>
  );
}

export function PdvFecharCaixaModal({
  valorApurado,
  enviando,
  onFecharCaixa,
  onFechar,
}: {
  valorApurado: number;
  enviando: boolean;
  onFecharCaixa: (valorInformado: number, observacoes: string) => void;
  onFechar: () => void;
}) {
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const informado = Number(valor) || 0;
  const diferenca = Math.round((informado - valorApurado) * 100) / 100;
  return (
    <PdvOverlay titulo="Fechar caixa" onFechar={onFechar} largura="md">
      <div className="pdv-pag-total">
        <span>Saldo apurado (dinheiro)</span>
        <strong>{formatarMoeda(valorApurado)}</strong>
      </div>
      <label className="pdv-campo">
        <span>Valor contado na gaveta</span>
        <input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </label>
      {valor ? (
        <p className={`pdv-fechar-dif${diferenca === 0 ? ' ok' : ''}`}>
          Diferença: {formatarMoeda(diferenca)}
        </p>
      ) : null}
      <label className="pdv-campo">
        <span>Observações</span>
        <input
          type="text"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Opcional"
        />
      </label>
      <div className="pdv-pag-acoes">
        <button type="button" className="pdv-btn-secundario" onClick={onFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="pdv-btn-primario"
          disabled={enviando || !valor}
          onClick={() => onFecharCaixa(informado, obs.trim())}
        >
          {enviando ? 'Fechando…' : 'Fechar caixa'}
        </button>
      </div>
    </PdvOverlay>
  );
}
