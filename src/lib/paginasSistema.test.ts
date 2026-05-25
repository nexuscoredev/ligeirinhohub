import { describe, expect, it } from 'vitest';
import { paginaPermitida, rotaPermitidaParaCargo } from './paginasSistema';

describe('rotaPermitidaParaCargo', () => {
  it('permite Administrador no dashboard', () => {
    expect(rotaPermitidaParaCargo('/dashboard', 'Administrador')).toBe(true);
  });

  it('nega Caixa em usuarios', () => {
    expect(rotaPermitidaParaCargo('/usuarios', 'Caixa')).toBe(false);
  });
});

describe('paginaPermitida', () => {
  it('sempre permite bem-vindo', () => {
    expect(
      paginaPermitida('/bem-vindo', 'Caixa', null, 'caixa@test.com'),
    ).toBe(true);
  });

  it('Visualizador sem paginas_permitidas não acessa dashboard', () => {
    expect(
      paginaPermitida('/dashboard', 'Visualizador', null, 'v@test.com'),
    ).toBe(false);
  });
});
