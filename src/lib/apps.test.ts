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

  it('Ligeirinho Marketing tem painel, promoções e TV', () => {
    const mkt = APPS_SISTEMA.find((a) => a.id === 'marketing');
    const rotas = mkt?.itens.map((i) => i.rota) ?? [];
    expect(mkt?.nome).toBe('Ligeirinho Marketing');
    expect(mkt?.iconeLabel).toBe('MKT');
    expect(rotas).toEqual([
      '/marketing',
      '/marketing/criar',
      '/marketing/galeria',
      '/marketing/promocoes',
      '/marketing/tv',
    ]);
    expect(appTemSubmenu(mkt!)).toBe(true);
  });
  it('Ligeirinho Financeiro aparece no launcher', () => {
    const fin = APPS_SISTEMA.find((a) => a.id === 'financeiro');
    expect(fin?.nome).toBe('Ligeirinho Financeiro');
    expect(fin?.itens.map((i) => i.rota)).toContain('/financeiro/receber');
    expect(appPorRota('/financeiro/caixa')?.app.id).toBe('financeiro');
  });
});

describe('rotaPermitidaParaCargo', () => {
  it('permite Administrador no dashboard', () => {
    expect(rotaPermitidaParaCargo('/admin/dashboard', 'Administrador')).toBe(
      true,
    );
  });

  it('nega Caixa em usuarios', () => {
    expect(rotaPermitidaParaCargo('/usuarios', 'Caixa')).toBe(false);
  });

  it('permite Desenvolvedor em admin/sistemas', () => {
    expect(rotaPermitidaParaCargo('/admin/sistemas', 'Desenvolvedor')).toBe(
      true,
    );
  });

  it('permite Desenvolvedor na visão estratégica', () => {
    expect(rotaPermitidaParaCargo('/admin/estrategico', 'Desenvolvedor')).toBe(
      true,
    );
  });

  it('permite CEO na visão estratégica', () => {
    expect(rotaPermitidaParaCargo('/admin/estrategico', 'CEO')).toBe(true);
  });

  it('nega Gerente na visão estratégica', () => {
    expect(rotaPermitidaParaCargo('/admin/estrategico', 'Gerente')).toBe(false);
  });

  it('nega Gerente em admin/sistemas', () => {
    expect(rotaPermitidaParaCargo('/admin/sistemas', 'Gerente')).toBe(false);
  });

  it('nega Gerente em admin/usuarios', () => {
    expect(rotaPermitidaParaCargo('/admin/usuarios', 'Gerente')).toBe(false);
  });

  it('permite Gerente no painel admin', () => {
    expect(rotaPermitidaParaCargo('/admin', 'Gerente')).toBe(true);
  });

  it('permite Comercial em marketing', () => {
    expect(rotaPermitidaParaCargo('/marketing/promocoes', 'Comercial')).toBe(
      true,
    );
  });

  it('nega Caixa em marketing', () => {
    expect(rotaPermitidaParaCargo('/marketing', 'Caixa')).toBe(false);
  });

  it('permite Desenvolvedor no app fiscal', () => {
    expect(rotaPermitidaParaCargo('/fiscal', 'Desenvolvedor')).toBe(true);
    expect(rotaPermitidaParaCargo('/fiscal/emitir', 'Financeiro')).toBe(true);
  });
  it('permite Financeiro no app financeiro', () => {
    expect(rotaPermitidaParaCargo('/financeiro', 'Financeiro')).toBe(true);
    expect(rotaPermitidaParaCargo('/financeiro/receber', 'Gerente')).toBe(true);
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
      paginaPermitida('/admin/dashboard', 'Visualizador', null, 'v@test.com'),
    ).toBe(false);
  });
});
