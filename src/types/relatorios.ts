export interface ResumoGerencial {
  vendas_hoje_qtd: number;
  vendas_hoje_valor: number;
  ticket_medio: number;
  receber_aberto: number;
  pagar_aberto: number;
  receber_vencido: number;
  pagar_vencido: number;
  lotes_vencendo: number;
  nfe_autorizadas: number;
  nfce_autorizadas: number;
  estoque_critico: number;
  clientes_ativos: number;
}

export interface VendaPorHora {
  hora: number;
  quantidade: number;
  valor_total: number;
}

export interface VendaMensalFiscal {
  mes: string;
  nfe_quantidade: number;
  nfe_valor: number;
  nfce_quantidade: number;
  nfce_valor: number;
}
