import type { Promocao, PromocaoUpdate } from '@/types/marketing';

export type CargoHub =
  | 'Desenvolvedor'
  | 'Administrador'
  | 'CEO'
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
  /** Nome para login na tela (ex.: Vinicius) */
  login: string;
  nome: string;
  cargo: CargoHub;
  ativo: boolean;
  paginas_permitidas: string[] | null;
  avatar_url?: string | null;
  bio?: string | null;
  telefone?: string | null;
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
      promocoes: {
        Row: Promocao;
        Insert: {
          produto_sku: string;
          produto_nome: string;
          preco_original: number;
          preco_promo: number;
          validade_inicio: string;
          validade_fim: string;
          ativo?: boolean;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: PromocaoUpdate;
      };
      produtos: {
        Row: {
          id: string;
          sku: string | null;
          nome: string;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          sku?: string | null;
          nome?: string;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          sku?: string | null;
          nome?: string;
          ativo?: boolean;
        };
      };
      clientes: {
        Row: { id: string; nome: string };
        Insert: { id?: string; nome?: string };
        Update: { id?: string; nome?: string };
      };
      pedidos: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      pedido_itens: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      pedido_ocorrencias: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      pedido_eventos: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      motoristas: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      veiculos: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      chat_threads: {
        Row: {
          id: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          created_by: string | null;
          created_at: string;
          updated_at: string;
        }>;
      };
      chat_participants: {
        Row: {
          thread_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string | null;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
        Update: Partial<{
          joined_at: string;
          last_read_at: string | null;
        }>;
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<{
          body: string;
        }>;
      };
      suporte_tickets: {
        Row: {
          id: string;
          criado_por: string;
          titulo: string;
          status: 'aberto' | 'resolvido';
          resolvido_em: string | null;
          resolvido_por: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          criado_por: string;
          titulo: string;
          status?: 'aberto' | 'resolvido';
          resolvido_em?: string | null;
          resolvido_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          titulo: string;
          status: 'aberto' | 'resolvido';
          resolvido_em: string | null;
          resolvido_por: string | null;
          updated_at: string;
        }>;
      };
      suporte_mensagens: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<{
          body: string;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      resolve_login_email: {
        Args: { p_login: string };
        Returns: string | null;
      };
    };
    Enums: {
      cargo_hub: CargoHub;
    };
    CompositeTypes: Record<string, never>;
  };
}
