import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';

const BUCKET_AVATAR = 'avatars';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type PerfilUpdateInput = {
  nome?: string;
  bio?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
};

export async function atualizarMeuPerfil(userId: string, input: PerfilUpdateInput) {
  const patch: Record<string, unknown> = {};
  if (input.nome !== undefined) patch.nome = input.nome.trim();
  if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;
  if (input.telefone !== undefined) patch.telefone = input.telefone?.trim() || null;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;

  if (Object.keys(patch).length === 0) {
    return { usuario: null as Usuario | null, error: null };
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(patch as never)
    .eq('id', userId)
    .select('*')
    .single();

  return { usuario: (data as Usuario | null) ?? null, error };
}

function extensaoPorMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function enviarAvatar(userId: string, file: File) {
  if (!file.type.startsWith('image/')) {
    return { url: null as string | null, error: new Error('Envie uma imagem (JPG, PNG ou WebP).') };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: new Error('Imagem muito grande. Máximo 2 MB.') };
  }

  const ext = extensaoPorMime(file.type);
  const path = `${userId}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET_AVATAR)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upErr) return { url: null, error: upErr };

  const { data: pub } = supabase.storage.from(BUCKET_AVATAR).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  return atualizarMeuPerfil(userId, { avatar_url: url }).then((res) => ({
    url: res.usuario?.avatar_url ?? url,
    error: res.error,
  }));
}

export async function removerAvatar(userId: string) {
  const { data: list, error: listErr } = await supabase.storage
    .from(BUCKET_AVATAR)
    .list(userId);

  if (!listErr && list?.length) {
    const paths = list.map((o) => `${userId}/${o.name}`);
    await supabase.storage.from(BUCKET_AVATAR).remove(paths);
  }

  return atualizarMeuPerfil(userId, { avatar_url: null });
}

export async function alterarMinhaSenha(novaSenha: string) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  return { error };
}
