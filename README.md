<div align="center">

# 🍷 Ligeirinho Hub

**Sistema operacional integrado para distribuidora** — venda, preparo, entrega e gestão em um único ecossistema web.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)](https://web.dev/progressive-web-apps/)

*Arquitetura inspirada no padrão maduro do **RG Ambiental** (SPA modular · Supabase · RLS por cargo · Realtime).*

</div>

---

## Ecossistema

```text
PDV · Totem · Delivery  →  Pedido (entidade central)  →  Operacional  →  Motoristas
                                    ↓
                         Dashboard · Hub Administrativo
```

| Módulo | Papel |
|--------|--------|
| **PDV** | Venda assistida no balcão |
| **Totem** | Autoatendimento (tablet PWA) |
| **Operacional** | Fila, preparo, separação, despacho |
| **Motoristas** | Entrega e confirmação em rota |
| **Dashboard** | KPIs e visão gerencial em tempo real |
| **Hub** | Cadastros, usuários, permissões, configuração |

---

## Visão geral

### Objetivo

Unificar **venda**, **operação** e **gestão** da distribuidora em uma SPA modular (PWA), com um único backend e pedido como entidade central.

### Problema que resolve

- Canais desconectados (balcão, totem, delivery) sem fila única
- Cardápio e preços inconsistentes entre pontos de venda
- Operação sem visibilidade em tempo real do status dos pedidos

### Visão de produto

> **Um pedido · um ID · um banco** — todo canal grava em `pedidos`; após confirmação financeira, o fluxo operacional é o mesmo: `novo` → `em_preparo` → `separado` → `aguardando_motorista` → `em_rota` → `entregue`.

### Arquitetura macro

```text
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Cliente   │────▶│ PDV / Totem │────▶│   Supabase   │
│  (Totem)    │     │  / Delivery │     │  PostgreSQL  │
└─────────────┘     └─────────────┘     │  Auth · RLS  │
                                        │  Realtime    │
┌─────────────┐     ┌─────────────┐     └──────┬───────┘
│  Gerência   │◀────│  Dashboard  │◀───────────┤
└─────────────┘     └─────────────┘            │
                     ┌─────────────┐            ▼
                     │ Operacional │◀─── Fila de pedidos
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │ Motoristas  │
                     └─────────────┘
                              │
                              ▼
                        Deploy: Vercel (SPA)
```

Documentação detalhada: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Notion: [Ligeirinho Hub](https://www.notion.so/367d9d0d448d81e29fb1cc4a5501775a)

---

## Arquitetura do sistema

### Fluxo operacional

```text
PDV / Totem / Delivery
        ↓
   Pedido criado
        ↓
   Fila operacional (Realtime)
        ↓
   Em preparo → Separado → Aguardando motorista
        ↓
   Em rota → Entregue (ou retirada no balcão)
        ↓
   Dashboard & relatórios
```

### Módulos (visão rápida)

| Módulo | Rota (prevista) | Responsabilidade |
|--------|-----------------|------------------|
| Hub | `/hub` | Administração, produtos, categorias, usuários |
| PDV | `/pdv` | Caixa, pagamento, pedido confirmado |
| Totem | `/totem` | Autoatendimento touch-first |
| Operacional | `/operacional` | Fila e transições de status |
| Motorista | `/motorista` | Entregas atribuídas |
| Dashboard | `/hub` (widget) | Métricas do dia |

**Fase 1 (MVP):** Auth, Hub, Produtos, Categorias, PDV, Totem (pagar no caixa), Operacional, Motoristas, PWA, Realtime.

---

## Stack oficial

### Frontend

| Tecnologia | Uso |
|------------|-----|
| **React 19** | UI e componentes |
| **TypeScript** | Tipagem forte em todo o código |
| **Vite 6** | Dev server, build, HMR |
| **React Router 7** | Rotas, layouts, code splitting |
| **PWA** | `vite-plugin-pwa` — totem/tablet instalável |

### Backend — Supabase

| Serviço | Uso |
|---------|-----|
| **PostgreSQL** | Pedidos, produtos, usuários, histórico |
| **Auth** | Login e sessão |
| **RLS** | Permissões por cargo (barreira final) |
| **Realtime** | Fila operacional e dashboard |
| **Storage** | Imagens e anexos (Fase 2) |
| **Edge Functions** | Webhooks, admin, integrações (Fase 2) |

### Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Vercel** | Hosting da SPA, previews, variáveis `VITE_*` |
| **Notion (MCP)** | PRD, fluxos, ADRs, decisões de produto |
| **Resend** | E-mail transacional *(planejado — Fase 2)* |

---

## Estrutura do projeto

### Estado atual (Fase 1 — scaffold)

```txt
ligeirinhobebidas/
├── docs/
│   └── ARCHITECTURE.md      # Fonte da verdade técnica
├── public/                  # Assets estáticos
├── supabase/
│   └── migrations/          # SQL versionado
├── src/
│   ├── components/          # Guards, ErrorBoundary
│   ├── contexts/            # Sessão e perfil
│   ├── layouts/             # Shell do Hub
│   ├── lib/                 # Supabase, rotas, permissões
│   ├── pages/               # Telas por rota
│   ├── types/               # Tipos compartilhados
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

### Estrutura alvo (domain-first)

A refatoração evolui para módulos por domínio, alinhada ao [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md):

```txt
src/
├── modules/                 # Feature modules por domínio
│   ├── auth/
│   ├── produtos/
│   ├── pdv/
│   ├── totem/
│   ├── operacional/
│   └── motoristas/
├── shared/
│   ├── ui/                  # Componentes visuais reutilizáveis
│   └── business/            # Regras compartilhadas (ex.: pedido)
├── layouts/                 # Layouts de rota (Hub, PDV, Totem…)
├── contexts/                # Providers globais
├── hooks/                   # Hooks reutilizáveis
├── services/                # Orquestração e APIs (quando não couber no módulo)
├── lib/                     # Infra: supabase client, lazy, constantes globais
├── types/                   # Tipos globais e gerados
└── constants/               # Enums, rotas, status de pedido
```

| Camada | Responsabilidade |
|--------|------------------|
| `modules/*` | UI + hooks + `*.service.ts` + tipos do domínio |
| `shared/ui` | Botões, cards, tabelas — sem regra de negócio |
| `shared/business` | Validações e helpers de pedido/status |
| `layouts/` | Menu, shell fullscreen (totem), guards de layout |
| `contexts/` | Auth, perfil, tema |
| `hooks/` | `usePedidos`, `useRealtime` — composição |
| `lib/` | Cliente Supabase, mapa de páginas, lazy retry |
| `types/` | `database.ts`, contratos de API |

---

## Regras arquiteturais

Estas regras são **obrigatórias** em PRs e revisões:

| Regra | Detalhe |
|-------|---------|
| **Sem `any`** | Usar `unknown` + narrowing ou tipos explícitos |
| **TypeScript forte** | Props, retornos de service e enums de status tipados |
| **Services isolados** | Acesso a Supabase em `*.service.ts`, não no JSX |
| **Sem negócio no JSX** | Componentes renderizam; hooks/services decidem |
| **Hooks reutilizáveis** | Lógica compartilhada em `use*` por domínio |
| **Domain-first** | Código de PDV não importa internals de Totem |
| **Shared UI** | Design system em `shared/ui` — DRY visual |
| **Status no backend** | Transições validadas em DB + espelho no client |
| **Um pedido, uma fila** | Nunca duplicar entidade por canal |

---

## Convenções

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Componentes React | PascalCase | `PedidoCard.tsx` |
| Hooks | `use` + PascalCase | `usePedidoFila.ts` |
| Variáveis / funções | camelCase | `buscarProdutos` |
| Rotas URL | kebab-case | `/hub/produtos` |
| Pastas | kebab-case | `pedido-status/` |
| Banco de dados | snake_case | `pedido_status_historico` |
| Serviços | `{dominio}.service.ts` | `pedidos.service.ts` |
| Tipos | `{dominio}.types.ts` | `pedidos.types.ts` |
| Constantes | `{dominio}.constants.ts` | `pedido-status.constants.ts` |

> **Não** usar sufixo `NEXUS` em nomes de arquivo — "Hub" é nome de produto apenas na UI.

---

## Setup local

### Pré-requisitos

- **Node.js** ≥ 20.19
- Conta [Supabase](https://supabase.com)
- (Opcional) [Vercel CLI](https://vercel.com/cli) para deploy

### 1. Clonar e instalar

```bash
git clone <url-do-repositorio>
cd ligeirinhobebidas
npm install
```

### 2. Variáveis de ambiente

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edite `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publicavel

# Opcional — produção / bypass
# VITE_APP_ORIGIN=https://seu-app.vercel.app
# VITE_PAGINAS_BYPASS_EMAILS=
```

### 3. Supabase — banco e auth

1. Crie um projeto em [supabase.com](https://supabase.com)
2. **SQL Editor** → execute:

   `supabase/migrations/20260521120000_usuarios_inicial.sql`

3. **Authentication** → **Users** → crie um usuário (e-mail + senha)
4. **Table Editor** → `usuarios` → defina `cargo` como `Administrador` ou `Desenvolvedor`

5. **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:4173`
   - Redirect URLs: `http://localhost:4173/**`

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abra: **http://localhost:4173**

### 5. Validar build (opcional)

```bash
npm run build
npm run preview
```

---

## Scripts do projeto

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Dev** | `npm run dev` | Vite dev server (porta **4173**) |
| **Build** | `npm run build` | `tsc -b` + bundle de produção |
| **Preview** | `npm run preview` | Preview local do build |
| **Lint** | `npm run lint` | ESLint em todo o projeto |
| **Test** | `npm run test` | Vitest (run once) |
| **Test watch** | `npm run test:watch` | Vitest em modo watch |
| **Deploy** | — | Push na `main` → Vercel *(configurar projeto)* |

```bash
# Fluxo típico antes de PR
npm run lint
npm run test
npm run build
```

---

## Roadmap

### Fase 1 — MVP operacional (30–45 dias)

- [x] Scaffold Hub (Auth, layout, rotas protegidas)
- [ ] Produtos e categorias (CRUD)
- [ ] Pedidos + máquina de estados
- [ ] PDV (core)
- [ ] Operacional + Realtime
- [ ] Motoristas (manual)
- [ ] Dashboard básico
- [ ] Totem (cardápio + pagar no caixa)

**Corte explícito:** sem combos, sem imagens de produto, sem PIX automático no totem.

### Fase 2 — Experiência e integrações (60–120 dias)

- Imagens (Storage), combos, PIX no totem
- WhatsApp, Active Entregas, relatórios
- Reconciliação financeira, `pedido_eventos`

### Fase 3 — Escala

- Multi-loja, BI avançado, IA/analytics
- NFC-e fiscal completo

Detalhes: Notion → [Limites Fase 1](https://www.notion.so/367d9d0d448d81adb412cde127bb80b7) · [Backlog Fase 2](https://www.notion.so/367d9d0d448d815998dffcbd87230217)

---

## Documentação

| Recurso | Descrição |
|---------|-----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | **Fonte da verdade** — stack, módulos, pedidos, RLS, convenções |
| [`docs/GIT_CONVENTION.md`](docs/GIT_CONVENTION.md) | Commits (Conventional), escopos, branches, ADR-GIT-01 |
| [Notion — Ligeirinho Hub](https://www.notion.so/367d9d0d448d81e29fb1cc4a5501775a) | PRD, fluxos, estados, exceções, ADRs |
| `RGAmbiental.pdf` | Referência de padrão (SPA + Supabase) |
| `supabase/migrations/` | Schema versionado |

**Documentos Notion recomendados para onboarding:**

- [Fluxo Operacional Completo](https://www.notion.so/367d9d0d448d81b7af83ceaf0974feb0)
- [Estados Oficiais do Pedido](https://www.notion.so/367d9d0d448d818f9fcdcd8a2466882c)
- [Exceções do Fluxo Operacional](https://www.notion.so/367d9d0d448d81adb8a3f84202f4e00f)

---

## Git Workflow & Commits

Padrão oficial: **[Conventional Commits](https://www.conventionalcommits.org/)** — documento completo em [`docs/GIT_CONVENTION.md`](docs/GIT_CONVENTION.md).

### Formato

```bash
<tipo>(<escopo>): <descrição em português, infinitivo, lowercase>
```

Exemplo:

```bash
feat(pdv): implementar geração de pedido
```

### Tipos principais

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudar regra de negócio |
| `docs` | Documentação |
| `test` | Testes |
| `chore` | Config / deps / infra |
| `style` | Visual / CSS |
| `perf` | Performance |
| `ci` | CI/CD |
| `build` | Build tooling |

### Escopos oficiais

`auth` · `dashboard` · `pdv` · `totem` · `operacional` · `pedidos` · `produtos` · `categorias` · `combos` · `motoristas` · `usuarios` · `relatorios` · `ui` · `pwa` · `database` · `realtime` · `deploy` · `docs` · `architecture`

### Branches

```text
main      → produção
develop   → homologação
feature/* → nova funcionalidade
fix/*     → correção
hotfix/*  → urgente em produção
```

Exemplos: `feature/pdv-cart` · `fix/login-session` · `hotfix/pdv-payment-crash`

### Regras rápidas

- Um objetivo por commit · verbo no infinitivo · tipos/escopos em inglês
- Evitar: `update`, `ajustes`, `mudanças`, `final`, `WIP` no histórico compartilhado
- Automação (`commitlint`, `husky`) planejada — ver `GIT_CONVENTION.md` §8

---

## Contribuição

1. Leia [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e [`docs/GIT_CONVENTION.md`](docs/GIT_CONVENTION.md) antes de abrir PR.
2. Siga as **convenções** e **regras arquiteturais** deste README.
3. Não introduza `any`, lógica de negócio em JSX ou filas paralelas de pedido.
4. Migrações SQL em `supabase/migrations/` com timestamp `YYYYMMDDHHMMSS_descricao.sql`.
5. Atualize tipos em `src/types/` quando alterar schema.
6. PRs pequenos por domínio (`produtos`, `pdv`, etc.) após a migração para `src/modules/`.

**Checklist de PR:**

- [ ] `npm run lint` sem erros
- [ ] `npm run test` passando
- [ ] `npm run build` passando
- [ ] RLS considerado para novas tabelas
- [ ] Transições de `pedidos.status` alinhadas ao enum oficial
- [ ] Commits no padrão Conventional (`docs/GIT_CONVENTION.md`)

---

## Licença

Copyright © 2026 Ligeirinho Hub. Todos os direitos reservados.

> Placeholder — definir licença proprietária ou contrato de cliente antes de repositório público.

---

<div align="center">

**Ligeirinho Hub** — rápido no balcão, claro no totem, visível na operação.

</div>
