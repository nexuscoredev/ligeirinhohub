import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';

interface PerfilContextValue {
  session: Session | null;
  usuario: Usuario | null;
  carregando: boolean;
  erro: string | null;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
}

const PerfilContext = createContext<PerfilContextValue | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setErro(error.message);
      setUsuario(null);
      return;
    }

    const perfil = data as Usuario | null;

    if (!perfil) {
      setErro(
        'Perfil não encontrado. Peça a um administrador para criar seu usuário na tabela usuarios.',
      );
      setUsuario(null);
      return;
    }

    if (!perfil.ativo) {
      setErro('Usuário inativo. Contacte o administrador.');
      setUsuario(null);
      return;
    }

    setErro(null);
    setUsuario(perfil);
  }, []);

  const recarregarPerfil = useCallback(async () => {
    if (!session?.user.id) return;
    await carregarPerfil(session.user.id);
  }, [session?.user.id, carregarPerfil]);

  useEffect(() => {
    let ativo = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      setSession(data.session);
      if (data.session?.user.id) {
        await carregarPerfil(data.session.user.id);
      }
      setCarregando(false);
    }

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession);
      if (novaSession?.user.id) {
        void carregarPerfil(novaSession.user.id);
      } else {
        setUsuario(null);
        setErro(null);
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarPerfil]);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setSession(null);
    setErro(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      usuario,
      carregando,
      erro,
      recarregarPerfil,
      sair,
    }),
    [session, usuario, carregando, erro, recarregarPerfil, sair],
  );

  return (
    <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
  );
}

export function usePerfil() {
  const ctx = useContext(PerfilContext);
  if (!ctx) {
    throw new Error('usePerfil deve ser usado dentro de PerfilProvider');
  }
  return ctx;
}
