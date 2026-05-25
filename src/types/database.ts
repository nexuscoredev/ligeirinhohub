export type CargoHub =
  | 'Desenvolvedor'
  | 'Administrador'
  | 'Gerente'
  | 'Caixa'
  | 'Estoquista'
  | 'Logistica'
  | 'Financeiro'
  | 'Comercial'
  | 'Visualizador';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: CargoHub;
  ativo: boolean;
  paginas_permitidas: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario;
        Insert: Omit<Usuario, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Usuario, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
