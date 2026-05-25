import { describe, expect, it } from 'vitest';
import {
  APPS_SISTEMA,
  appPorRota,
  appTemSubmenu,
  paginaPermitida,
  rotaPermitidaParaCargo,
} from './apps';

describe('apps do sistema', () => {
  it('Ligeirinho Operacional contém Clientes e Motoristas', () => {
    const op = APPS_SISTEMA.find((a) => a.id === 'operacional');
    const rotas = op?.itens.map((i) => i.rota) ?? [];
    expect(op?.nome).toBe('Ligeirinho Operacional');
    expect(rotas).toContain('/clientes');
    expect(rotas).toContain('/motorista');
    expect(rotas).toContain('/pedidos');
  });

  it('apps de tela única não têm submenu', () => {
    const pdv = APPS_SISTEMA.find((a) => a.id === 'pdv');
    expect(pdv?.nome).toBe('Ligeirinho PDV');
    expect(appTemSubmenu(pdv!)).toBe(false);
    expect(appTemSubmenu(APPS_SISTEMA.find((a) => a.id === 'operacional')!)).toBe(
      true,
    );
  });

  it('resolve app por rota de cliente', () => {
    const ctx = appPorRota('/clientes');
    expect(ctx?.app.nome).toBe('Ligeirinho Operacional');
    expect(ctx?.item.titulo).toBe('Clientes');
  });
});

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
