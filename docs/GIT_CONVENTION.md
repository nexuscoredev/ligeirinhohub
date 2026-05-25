# Git Convention — Ligeirinho Hub

> **Padrão oficial de commits e branches** do repositório. Inspirado em projetos maduros (Conventional Commits) e alinhado ao fluxo do **RG Ambiental**.  
> **Versão:** 1.0 · **Data:** 2026-05-21

---

## Decisão única (oficial)

> **Este é o padrão oficial de commits do Ligeirinho Hub:**
>
> Mensagens no formato **Conventional Commits** — `tipo(escopo): descrição` — tipos e escopos em **inglês técnico**, descrição em **português** permitida, verbo no **infinitivo**, **lowercase**, **um objetivo por commit**. Branches: `main` (produção), `develop` (homologação), `feature/*`, `fix/*`, `hotfix/*`.

**Justificativa:** histórico legível, changelog automático no futuro, revisão de PR mais rápida, consistência com o ecossistema RG e ferramentas (`commitlint`, `semantic-release`).

---

## 1. Formato da mensagem

```text
<tipo>(<escopo opcional>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Regras obrigatórias

| Regra | Detalhe |
|-------|---------|
| Commit curto | Título ≤ **72 caracteres** (ideal ≤ 50) |
| Verbo no infinitivo | `implementar`, `corrigir`, `adicionar`, `remover` |
| Lowercase | Título em minúsculas (exceto nomes próprios se necessário) |
| Um objetivo | Um commit = uma mudança lógica revisável |
| Tipos e escopos | Inglês técnico: `feat`, `pdv`, `auth` |
| Descrição | Português permitido e recomendado para o time |

### Exemplo ideal

```bash
feat(pdv): implementar geração de pedido
```

### Breaking change (futuro)

Quando uma alteração quebrar contrato de API ou schema:

```bash
feat(pedidos)!: alterar enum de status do pedido

BREAKING CHANGE: status `confirmado` renomeado para `novo`
```

---

## 2. Tipos oficiais de commit

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **feat** | Nova funcionalidade | `feat(pdv): adicionar carrinho de compras` |
| **fix** | Correção de bug | `fix(auth): corrigir persistência de sessão` |
| **refactor** | Refatoração sem mudar regra de negócio | `refactor(pedidos): simplificar hook realtime` |
| **style** | Visual, CSS, formatação (sem lógica) | `style(ui): ajustar espaçamento do card de produto` |
| **docs** | Documentação | `docs(architecture): atualizar fluxo do pedido` |
| **test** | Testes | `test(auth): cobrir guard de rota protegida` |
| **chore** | Infra, deps, config sem feature | `chore(vite): configurar aliases do projeto` |
| **perf** | Melhoria de performance | `perf(operacional): reduzir re-renders da fila` |
| **ci** | CI/CD, pipelines | `ci(deploy): adicionar workflow de build na vercel` |
| **build** | Build tooling | `build(vite): otimizar chunk do módulo pdv` |

### Quando usar cada tipo

- **feat** — comportamento novo visível ao usuário ou API nova.
- **fix** — algo quebrado volta a funcionar.
- **refactor** — reorganização; testes e comportamento devem permanecer iguais.
- **docs** — README, `docs/*`, comentários de arquitetura, Notion espelhado em repo.
- **chore** — `package.json`, `.env.example`, ESLint, sem impacto em runtime.
- **database** — use escopo `database` com tipo `feat` ou `fix`:  
  `feat(database): criar tabela pedidos e enum pedido_status`

---

## 3. Escopos oficiais (scope)

O escopo indica **módulo ou área** afetada. Use um dos valores abaixo quando aplicável.

| Escopo | Área |
|--------|------|
| `auth` | Login, sessão, guards, cargos |
| `dashboard` | KPIs, visão gerencial |
| `pdv` | Ponto de venda / caixa |
| `totem` | Autoatendimento |
| `operacional` | Fila, preparo, separação |
| `pedidos` | Entidade pedido, status, transições |
| `produtos` | CRUD produtos, estoque |
| `categorias` | CRUD categorias |
| `combos` | Combos (Fase 2) |
| `motoristas` | Entregas e app motorista |
| `usuarios` | Perfis, permissões, `paginas_permitidas` |
| `relatorios` | Relatórios (Fase 2) |
| `ui` | `shared/ui`, design system |
| `pwa` | Service worker, manifest, offline |
| `database` | Migrations, RLS, triggers SQL |
| `realtime` | Subscriptions Supabase |
| `deploy` | Vercel, env, preview |
| `docs` | README, convenções, arquitetura |
| `architecture` | Decisões estruturais transversais |

### Escopo opcional

Commits transversais podem omitir escopo:

```bash
chore: atualizar dependências do projeto
docs: adicionar convenção de commits
```

Prefira **sempre** escopo quando a mudança for claramente de um módulo.

---

## 4. Exemplos reais do projeto

```bash
# Fase 1 — scaffold e auth
feat(auth): implementar login com supabase
feat(auth): adicionar contexto de perfil e cargo
fix(auth): corrigir redirect após logout

# Hub e permissões
feat(usuarios): aplicar guard por paginas_permitidas
refactor(auth): extrair mapa de rotas para lib

# Documentação
docs(readme): reestruturar onboarding técnico
docs(architecture): documentar máquina de estados do pedido
docs: adicionar git convention

# Banco
feat(database): criar migration usuarios inicial
feat(database): adicionar tabela pedidos e rls

# PDV / Totem (futuro próximo)
feat(pdv): implementar busca de produtos no caixa
feat(totem): adicionar fluxo aguardando pagamento
feat(pedidos): validar transição novo para em_preparo

# Operacional
feat(operacional): exibir fila com realtime
feat(realtime): assinar updates da tabela pedidos

# Infra
chore(vite): configurar plugin pwa
ci(deploy): configurar preview na vercel
perf(operacional): memoizar lista de cards da fila
```

---

## 5. Commits proibidos

Não use mensagens vagas ou fora do padrão:

| Proibido | Por quê |
|----------|---------|
| `update` | Não informa o quê nem onde |
| `teste` | Não é tipo `test` nem descrição clara |
| `ajustes` | Ambíguo |
| `mudanças` | Ambíguo |
| `coisa nova` | Não profissional / irrevisável |
| `final` | Sem significado |
| `WIP` | Use commit local; squash antes do merge |
| `fix stuff` | Idioma misto sem escopo |

**Substitua por:**

```bash
fix(pdv): corrigir total do carrinho com desconto
feat(totem): implementar tela de revisão do pedido
```

---

## 6. Branch strategy

```text
main          → produção (Vercel production)
develop       → homologação / integração contínua
feature/*     → novas funcionalidades
fix/*         → correções não urgentes
hotfix/*      → correção urgente em produção
```

### Convenção de nomes de branch

```text
feature/<escopo>-<descricao-curta>
fix/<escopo>-<descricao-curta>
hotfix/<escopo>-<descricao-curta>
```

**Kebab-case**, inglês técnico no prefixo, descrição pode misturar português:

```text
feature/pdv-cart
feature/auth-rbac
feature/totem-checkout
fix/login-session
fix/realtime-fila-duplicada
hotfix/pdv-payment-crash
```

### Fluxo recomendado

```text
1. Criar branch a partir de develop (ou main se develop não existir ainda)
   git checkout -b feature/pdv-cart

2. Commits seguindo Conventional Commits

3. Abrir PR → develop

4. Após QA → merge develop → main (release)
```

### Hotfix

```text
main → hotfix/pdv-urgent-fix → PR → main
                              └→ cherry-pick ou merge em develop
```

---

## 7. Relação com PR e revisão

| Prática | Regra |
|---------|--------|
| Título do PR | Pode espelhar o commit principal ou usar o mesmo formato: `feat(pdv): carrinho e checkout` |
| Squash merge | Preferir título final no padrão Conventional Commits |
| Migrations | Commit dedicado: `feat(database): ...` |
| Docs only | `docs:` ou `docs(escopo):` — não misturar com feat no mesmo commit |

---

## 8. Automação futura (não implementar ainda)

Terreno preparado para:

| Ferramenta | Função |
|------------|--------|
| **commitlint** | `@commitlint/config-conventional` + escopos customizados do Hub |
| **husky** | `commit-msg` hook validando formato |
| **semantic-release** | Versionamento e changelog a partir dos commits |
| **GitHub Actions** | Lint de commit em PR |

### Configuração futura (referência)

```json
// commitlint.config.js (rascunho — Fase 2)
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [2, "always", [
      "auth", "dashboard", "pdv", "totem", "operacional", "pedidos",
      "produtos", "categorias", "combos", "motoristas", "usuarios",
      "relatorios", "ui", "pwa", "database", "realtime", "deploy",
      "docs", "architecture"
    ]]
  }
}
```

Até lá: **revisão humana** no PR é obrigatória.

---

## 9. ADR

**ADR-GIT-01** — Conventional Commits + branch strategy v1 (este documento).

Registrar em Notion → Decisões Técnicas (ADR), seção Git.

---

## 10. Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — convenções de código
- [`README.md`](../README.md) — Git Workflow (resumo)
