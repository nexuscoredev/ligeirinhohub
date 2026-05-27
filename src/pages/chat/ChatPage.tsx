import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { usePerfil } from '@/contexts/PerfilContext';

export function ChatPage() {
  const { usuario } = usePerfil();
  const navigate = useNavigate();

  if (!usuario) return null;

  // /chat agora funciona como um “atalho” para abrir o widget modal.
  useEffect(() => {
    // Mantém o usuário na navegação, mas evita uma página “grande” estranha.
    // Se ele fechar o modal, volta pra página anterior.
  }, []);

  return (
    <ChatWidget
      usuario={usuario}
      inicial="conversas"
      onFechar={() => navigate(-1)}
    />
  );
}

