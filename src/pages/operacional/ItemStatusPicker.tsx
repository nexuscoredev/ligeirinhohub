import type { ItemStatusSeparacao } from '@/types/pedidos';
import {
  ITEM_STATUS_SEPARACAO_HINT,
  ITEM_STATUS_SEPARACAO_LABEL,
} from '@/lib/pedidos/itemStatusSeparacao';

const OPCOES: ItemStatusSeparacao[] = ['separado', 'pendente', 'indisponivel'];

interface ItemStatusPickerProps {
  value: ItemStatusSeparacao;
  disabled?: boolean;
  onChange: (status: ItemStatusSeparacao) => void;
}

export function ItemStatusPicker({ value, disabled, onChange }: ItemStatusPickerProps) {
  return (
    <div className="ops-status-picker" role="group" aria-label="Status do item">
      {OPCOES.map((status) => (
        <button
          key={status}
          type="button"
          className={`ops-status-btn ops-status-btn--${status}${value === status ? ' ativo' : ''}`}
          disabled={disabled}
          title={ITEM_STATUS_SEPARACAO_HINT[status]}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {ITEM_STATUS_SEPARACAO_LABEL[status]}
        </button>
      ))}
    </div>
  );
}
