export interface CriterioGoLive {
  criterio: string;
  titulo: string;
  ok: boolean;
  automatico: boolean;
  detalhe: string;
  confirmado_manual: boolean;
}

export interface ResumoGoLive {
  criterios: CriterioGoLive[];
  prontos: number;
  total: number;
  liberado: boolean;
}
