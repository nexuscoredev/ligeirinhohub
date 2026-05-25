import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { emailParaLogin } from '@/lib/authLogin';

describe('emailParaLogin', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('retorna null para usuário vazio', async () => {
    expect(await emailParaLogin('')).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('chama resolve_login_email com login trimado', async () => {
    rpcMock.mockResolvedValue({ data: 'viniciusdemorais@hub.ligeirinho.com', error: null });
    const email = await emailParaLogin('  Vinicius  ');
    expect(rpcMock).toHaveBeenCalledWith('resolve_login_email', {
      p_login: 'Vinicius',
    });
    expect(email).toBe('viniciusdemorais@hub.ligeirinho.com');
  });

  it('retorna null quando RPC falha', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'erro' } });
    expect(await emailParaLogin('x')).toBeNull();
  });
});
