# Reunião Denis × Vinícius — Estrutura e pontos de ajuste

> Transcrição estruturada (sem implementação). Alinhamento com **Ligeirinho Hub** + apps (PDV, Totem, Operacional, Motoristas).  
> Data de referência da conversa: maio/2026.

---

## 1. Resumo executivo

| Tema | Dor hoje | Direção acordada |
|------|----------|------------------|
| Separação | Folha impressa, rabisco, ordem confusa | Tablet, ordem por **tipo de produto** + alfabética, foto do item |
| Pedido vs orçamento | Orçamento vira pedido só quando Denis “recebe”; papel se perde | Status digital, **impressão só após separação confirmada** |
| Estoque na separação | Falta item → rabisca folha | Qtd **separada** ≠ qtd **pedida**; valor da nota só atualiza no **fechamento** da separação |
| Entrega / retirada | Assinatura em papel, sem quem/quando | Assinatura digital, retirada/entrega rastreada |
| Erros pós-entrega | Troca whisky (Buchanan’s ↔ Ballantine’s) sem rastro | **Ocorrência** na entrega + status de correção com prioridade |
| Crédito / inadimplência | >R$ 100k em aberto, pagamento “quebrado” | Bloqueio de **novo pedido** por cliente inadimplente + regra de vencimento (ex.: terça) |
| Preço | Tabela promoção recalcula pedido antigo | **Preço congelado no pedido**; tabela fixa por cliente no cadastro |
| Canais | WhatsApp, Cayena, balcão misturados | Um pedido / um ID; filtro por origem (Cayena, app, tablet, WhatsApp fase 2) |
| PDV / Totem | Fila no caixa, pagamento misturado no balcão | Totem/PDV **só unidade (varejo)**; pagamento definido **pelo cliente no totem**; caixa só confere |
| Marketing | Tempo alto em arte + lista WhatsApp | App **Ligeirinho Marketing** no Hub; TV com promoções; site com promoções (evolução) |

**Prioridade declarada:** fluxo de **pedido + separação + operação** (app Operacional em tablet) — antes de marketing, mas marketing é “urgente” paralelo.

**Prazo citado:** 45 dias (expectativa de entregar antes).

---

## 2. Modelo mental: Hub e apps

```text
                    ┌─────────────────────────────┐
                    │      Ligeirinho Hub         │
                    │  (cadastro, usuários, KPI)  │
                    └──────────────┬──────────────┘
           ┌──────────┼──────────┬──────────────┐
           ▼          ▼          ▼              ▼
      Ligeirinho   Ligeirinho   Ligeirinho   Ligeirinho
         PDV         Totem      Operacional   Marketing*
           │            │            │              │
           └────────────┴────────────┴──────────────┘
                              │
                    Pedido único (PostgreSQL)
                    + itens + status + ocorrências
```

\* Marketing: citado como futuro app dentro do Hub; TV/QR/promoções.

**Dependência crítica (Denis + Vinícius):** separação digital exige **base de produtos** migrada do sistema atual — extração/migração é etapa explícita, não opcional.

---

## 3. Fluxo operacional desejado (separação no tablet)

### 3.1 Entrada do pedido

| Origem (futuro) | Hoje | Regra |
|-----------------|------|--------|
| WhatsApp | Principal | Transcrição “como chegou” → no sistema, ordenação na **exibição** |
| App/site cliente | Planejado | Pedido direto, sem digitação manual |
| Cayena (outro CNPJ) | Pasta separada | Mesma tabela de pedidos, flag **origem = Cayena** |
| Balcão / tablet loja | Parcial | Flag origem |
| Totem | MVP | Número do pedido → caixa |

**Orçamento → pedido:** só vira operação para Denis quando **recebido/aceito** (equivalente a “fechou negócio”).

### 3.2 Lista de separação (substitui a folha)

1. Pedido entra na fila em **ordem cronológica** (FIFO — “chegou primeiro, separa primeiro”).
2. Itens exibidos em **ordem alfabética dentro de cada tipo/categoria**:
   - Ex.: todos whiskies juntos, cervejas, vodkas, refrigerantes, águas (água, água de coco, com gás, 1,5 L…).
3. Cada linha: produto + **foto** + qtd pedida + ações.
4. Separador percorre corredor físico alinhado à lista (menos “pensar”).

### 3.3 Durante a separação (sem alterar pedido “oficial” ainda)

| Ação | Comportamento |
|------|----------------|
| Item OK | Marcar linha OK (ex.: 20/20 Skol) |
| Falta parcial | Qtd separada < pedida (ex.: pediu 30 Amstel, separou 20); **pedido original mantém 30** |
| Falta total | Qtd separada = 0 |
| Pausa (ex.: chegou Corona) | Botão **Parar separação** — pedido **travado** no status; retomar depois no mesmo ponto |
| Próximo pedido | **Proibido** pular fila — sistema só oferece o próximo cronológico |

**Regra de ouro:** separador **não** aperta “atualizar pedido/nota” — só registra separação real; **atualização financeira/oficial** é etapa posterior (perfil admin).

### 3.4 Fechamento da separação

1. Separador conclui todas as linhas (OK / qtd separada / observação implícita na diferença).
2. Ação **Concluir separação** → sistema recalcula valor da nota (ex.: R$ 12.169 → R$ 11.000).
3. **Só então:** pedido elegível para impressão/emissão do documento que hoje é papel.
4. Status passa para algo como **Separado / pronto para embarque ou retirada**.

### 3.5 Pós-separação: entrega ou retirada

| Modalidade | Fluxo |
|------------|--------|
| **Retirada** | Cliente retira → registro **quem retirou** + **quando** + **assinatura digital** no tablet |
| **Entrega** | Motorista → conferência no local → assinatura de quem recebeu (ex.: funcionário do Bar do Chico) |

### 3.6 Conferência na entrega e ocorrências

**Cenário A — erro identificado na hora (ideal):**

- Motorista/entregador abre ocorrência no app: “Pedido #8731 — esperado 4 Buchanan’s, recebido 4 Ballantine’s”.
- Alerta imediato (tipo “acionar agora”).
- Pedido ganha status **Com ocorrência** (visível para Denis/gerência).

**Cenário B — erro identificado depois:**

- Nota já estava **concluída/entregue**.
- Relato posterior → mesma ocorrência, mas sem retravaentrega na hora.
- Resolução: Denis valida (ex.: “troca já feita”) → **remove ocorrência** e fecha.

**Cenário C — separação errada que exige refazer:**

- Pedido já “pronto” volta para status tipo **Separação incorreta / refazer** com **prioridade no topo** da fila (acima de pedidos novos normais).

---

## 4. Máquina de estados (proposta para validar)

Estados sugeridos a partir da conversa (nomes podem ser refinados):

```text
[Orçamento] ──aceite──► [Novo / Aguardando separação]
                              │
                              ▼
                    [Em separação] ◄──┐
                         │  │       │ retomar
                    pausar│  │concluir
                         ▼  ▼
                    [Separação pausada]
                         │
                         ▼
              [Separado - aguardando doc/impressão]
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    [Aguardando retirada]    [Aguardando entrega / em rota]
              │                     │
              ▼                     ▼
    [Retirado + assinatura]  [Entregue + assinatura]
              │                     │
              └──────────┬──────────┘
                         ▼
                   [Concluído]
                         │
            ocorrência──►[Com ocorrência]──►[Em correção]──► ...
```

**Ajustes explícitos pedidos por Denis:**

| Regra | Detalhe |
|-------|---------|
| Cronologia | Fila principal por **hora de chegada/aceite** |
| Prioridade | Ocorrência de separação errada **sobe** na fila |
| Impressão | Apenas se status = separado confirmado |
| Alteração de itens pós-separado | **Não** para separador nem “galera de cima” — só **admin/dono** |
| Orçamento entregue | Hoje: item ainda pode ser removido no sistema → **bug de negócio** a eliminar |

---

## 5. Autenticação e rastreabilidade (tablet operação)

| Requisito | Detalhe |
|-----------|---------|
| Login por usuário/senha | Tablet não fica “logado na loja” anonimamente — cada separador entra |
| Quem separou | Audit: usuário X começou/concluiu/pausou pedido Y |
| Timeout | ~**30 min** inatividade → pedir senha de novo (evitar tablet aberto com sessão de outro) |
| Identificação do tablet | Opcional: “tablet da loja” vs usuário humano |
| Biometria/facial | “Se der muito trabalho, sem problema” — login/senha basta |

**Alinhamento com Hub atual:** login por **Usuário + senha** já implementado; falta vincular eventos operacionais ao `usuarios.id`.

---

## 6. Produtos, preço e cliente

### 6.1 Preço no pedido

| Problema atual | Solução acordada |
|----------------|------------------|
| Reabrir pedido antigo e mudar “tabela promoção” recalcula tudo com preço de hoje | **Snapshot de preço por linha** no momento do pedido |
| Promoção passada vs hoje | Cliente paga preço **do dia da compra**, não “valor presente” |
| Múltiplas tabelas globais | **Uma tabela por cliente** no cadastro (ex.: Vinícius usa tabela A, fulano usa B) |
| Promoção dinâmica no pedido antigo | Denis: **não vai mais usar** troca de tabela no pedido fechado — tabela fixa no cliente |

### 6.2 Cadastro de cliente e crédito

| Requisito | Comportamento |
|-----------|----------------|
| Condição de pagamento | Ex.: “toda terça subsequente” independente do dia da compra |
| Inadimplência | Se há pedido em aberto vencido → **bloquear emissão de novo pedido** para aquele cliente |
| Mensagem | Sistema “travado” — não depende de Denis negociar caso a caso |
| Exceção manual | Só via perfil alto (dono/admin), não rotina |

### 6.3 Catálogo

- **Imagem por produto** na separação (urgente para reduzir erro tipo Buchanan’s/Ballantine’s).
- Nomenclatura/categorias revisáveis para ordenação por **tipo** + alfabética.
- Migração da base do sistema legado → pré-requisito.

---

## 7. PDV e Totem (varejo)

| Regra | Detalhe |
|-------|---------|
| Unidade de venda | **Só unidade** no totem/tablet varejo (latinha, unidade avulsa) — não caixa fechada nesse canal |
| PDV caixa | Cobre mix: “2 caixas + 2 latinhas” em atendimento curto |
| Pagamento no totem | Cliente informa **split** (ex.: R$ 4.000 dinheiro + R$ 5.000 PIX) **antes** de finalizar |
| Alteração no caixa | Caixa **não altera** pagamento — “igual McDonald’s”: volta ao totem, ~30s |
| Fluxo caixa | Digita **número do pedido** → confere valor e formas → recebe |

---

## 8. Canais e filtros (visão Denis)

| Filtro na fila/lista | Uso |
|----------------------|-----|
| Todos os pedidos | Visão geral |
| Cayena | Símbolo/origem Cayena (impressão Cayena ainda existe hoje — digitalizar) |
| Tablet loja | Pedidos digitados no balcão |
| App cliente | Futuro: cliente digitou |
| WhatsApp | Até migrar para app |

**Multi-CNPJ:** Ligeirinho + Cayena → mesma tabela, campo `origem` / `marca`.

---

## 9. Marketing e TV (paralelo, urgente para Denis)

| Item | Decisão / ideia |
|------|-----------------|
| TV na loja | Placa + TV; conteúdo = **promoções do dia** |
| Atualização | Diária; validade (ex.: até dia 25) — mudou no sistema → mudou na TV |
| Quem altera preço no sistema | Meninas |
| Quem decide promoção | Denis (lista para Denise / equipe) |
| QR / ferramenta atual | Export formato TV; avaliar **extensão de tela do PC** vs Fire TV vs pen drive |
| Lista WhatsApp + imagem | Hoje: cliente não acha produto só pela imagem (ex.: Cantinho do Vale) → lista escrita + arte |
| Evolução Hub | App **Ligeirinho Marketing** — vídeo com promoções em loop, sync com base de produtos |
| Site pedidos | Reaproveitar site existente após **replicar base de itens**; promoções selecionáveis pelo cliente |

**Ajuste:** marketing depende menos de “separação” mas Denis classifica como **urgente** por tempo gasto hoje.

---

## 10. Papéis (cargos) — matriz de permissões (rascunho)

| Ação | Separador | Caixa | Motorista | Gerente | Admin/Dono |
|------|-----------|-------|-----------|---------|------------|
| Ver fila cronológica | ✓ | ○ | ○ | ✓ | ✓ |
| Separar / pausar / OK linha | ✓ | — | — | ○ | ✓ |
| Concluir separação (recalcula nota) | ✓* | — | — | ○ | ✓ |
| Atualizar pedido oficial / remover item | — | — | — | — | ✓ |
| Registrar ocorrência entrega | — | — | ✓ | ✓ | ✓ |
| Resolver/fechar ocorrência | — | — | — | ✓ | ✓ |
| Assinatura retirada/entrega | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bloquear cliente inadimplente | — | — | — | ✓ | ✓ |
| Emitir pedido p/ inadimplente | — | — | — | — | ✓ (exceção) |
| Calendário / visão CEO | — | — | — | ✓ | ✓ |

\* Concluir separação: confirmar se gerente também pode ou só separador + admin.

**“Esquece o vendedor”** no fluxo de separação — rastreio por **quem separou/entregou**, não vendedor da nota.

---

## 11. Mapa: o que o Hub já prevê vs gaps desta reunião

| Capacidade | No README/ARCHITECTURE hoje | Gap / ajuste da reunião |
|------------|---------------------------|-------------------------|
| Fila operacional | ✓ MVP | Falta: ordenação por **categoria+alfa**, foto, qtd separada, pausar |
| Status pedido | ✓ genérico (`novo` → `entregue`) | Expandir estados: pausado, ocorrência, refazer separação, orçamento |
| Realtime | ✓ MVP | Notificações de ocorrência para Denis |
| PDV / Totem | ✓ MVP escopo | Refinar: só unidade no totem; split pagamento; caixa só leitura |
| Motoristas | ✓ MVP | + ocorrência na entrega + assinatura |
| Produtos + imagem | Imagens **Fase 2** | Denis trata imagem na separação como **prioridade operacional** — reclassificar |
| WhatsApp | Fase 2 | Ainda é canal real hoje — integração ou entrada manual estruturada |
| Preço congelado | Implícito em “pedido central” | Explicitar `preco_unitario` snapshot + tabela por cliente |
| Inadimplência | Não detalhado | Novo: regra de bloqueio + condição pagamento |
| Cayena / multi-origem | Parcial | Campo origem + UI filtro |
| Marketing app | Não no MVP | Novo app no Hub (paralelo) |
| Assinatura digital | Não detalhado | Novo requisito retirada/entrega |
| Orçamento vs pedido | Não detalhado | Estados e permissões diferentes |
| Anti-fraude edição | RLS por cargo | Pedido “entregue” ainda editável no legado → proibir no novo sistema |

---

## 12. Priorização sugerida (para alinhar com sócio — 1h reunião)

### Onda 0 — Fundação (bloqueia tudo)

1. Migração **produtos + categorias** (tipos: whisky, cerveja, água…).
2. Modelo **pedido + itens_pedido** com preço snapshot e origem (Cayena, etc.).
3. **Clientes** + tabela de preço por cliente + condição de pagamento / inadimplência.

### Onda 1 — Operacional tablet (prioridade Denis)

1. Fila cronológica + filtros origem.
2. Tela separação: tipo+alfa, foto, OK / qtd separada / pausar / concluir.
3. Recálculo nota só no fechamento; impressão pós-separado.
4. Login separador + auditoria + timeout 30 min.
5. Status ocorrência + prioridade refazer.

### Onda 2 — Entrega e retirada

1. Assinatura digital retirada/entrega.
2. App motorista + ocorrência com alerta.
3. Calendário do dia + visão ocorrências (cargo CEO/gerente).

### Onda 3 — PDV / Totem (regras de pagamento)

1. Totem unidade; split pagamento; caixa por número do pedido.

### Onda 4 — Marketing + site promoções

1. TV / extensão tela ou Fire TV.
2. Ligeirinho Marketing no Hub.
3. Site com promoções alinhado à base (substitui lista WhatsApp gradualmente).

### Fora / depois

- WhatsApp automático (Fase 2 já no doc).
- Cayena B2B integrada.
- NFC-e fiscal completo.

---

## 13. Pontos de ajuste explícitos (checklist de validação)

Use esta lista na próxima conversa com Denis — marcar ✓/✗/ajustar texto.

### Separação

- [ ] FIFO estrito — não escolher pedido fora da ordem.
- [ ] Ordenação: **categoria/tipo** depois **alfabética** (não só alfabética global).
- [ ] Foto obrigatória na linha do item (MVP operacional ou Fase 1.1).
- [ ] Qtd separada vs pedida; pedido original intacto até concluir.
- [ ] Botão **Parar separação** com retomada no mesmo item.
- [ ] **Concluir separação** → recalcula valor → libera impressão.
- [ ] Separador **não** pode “atualizar pedido” nem remover linha.

### Pedido e documento

- [ ] Orçamento ≠ pedido operacional até aceite.
- [ ] Pedido entregue **não** editável exceto admin.
- [ ] Impressão/documento só após separado.

### Entrega e ocorrência

- [ ] Assinatura digital retirada e entrega.
- [ ] Ocorrência na entrega com alerta.
- [ ] Status “refazer separação” com prioridade.
- [ ] Fluxo “troca já feita” → encerrar ocorrência sem reabrir pedido inteiro.

### Financeiro / cliente

- [ ] Preço congelado por linha no pedido.
- [ ] Tabela de preço por cliente (sem re-tabelar pedido antigo).
- [ ] Regra vencimento (ex.: terça subsequente).
- [ ] Bloqueio automático novo pedido se inadimplente.

### Canais

- [ ] Campo origem: Cayena, balcão, totem, app, WhatsApp (manual).
- [ ] Cayena na mesma fila com filtro (e impressão digital futura).

### PDV / Totem

- [ ] Totem: somente **unidade** (varejo).
- [ ] Pagamento múltiplo definido no totem; caixa não edita.
- [ ] Caixa localiza pedido por número.

### Sistema / Hub

- [ ] App alvo: **Ligeirinho Operacional** (tablet), não só Hub admin.
- [ ] Migração base legado antes de prometer go-live separação.
- [ ] Marketing como app separado no Hub (urgência operacional de Denis).

### UX tablet

- [ ] Login usuário obrigatório; timeout 30 min.
- [ ] Registrar quem separou / pausou / concluiu.

---

## 14. Riscos e decisões em aberto

| # | Tema | Pergunta para Denis |
|---|------|---------------------|
| 1 | Quem pode **concluir separação** e disparar novo valor? | Só separador ou também gerente? |
| 2 | **Gerente** pode pausar pedido de outro separador? | |
| 3 | Impressão Cayena | Mesmo layout da Karen hoje ou novo template? |
| 4 | Orçamento no legado | Migrar histórico ou só pedidos novos? |
| 5 | Conferência Coca “não tinha” | Fluxo: gerente confere estoque antes de concluir separação? |
| 6 | Ocorrência | SLA / quem é notificado além de Denis? |
| 7 | Inadimplência | Regra exata: bloqueia no vencimento ou X dias após? |
| 8 | Imagens | Gerar IA para todo catálogo — escopo e quem aprova? |
| 9 | WhatsApp | Até quando entrada manual com “ordenação na tela” basta? |
| 10 | Marketing | PC espelhando TV vs Fire TV vs QR mensal — decisão de hardware |

---

## 15. Frases-chave (rastreio de requisitos)

> *“Não quero mais folha — quero tablet; pedido em ordem; separar sem rabisco; só atualiza nota quando concluir.”* — Denis  

> *“Pedido original mantém 30; separado 20; no fechamento o valor muda.”* — alinhamento Vinícius/Denis  

> *“Impressão só depois que está separado; fila cronológica; ocorrência com prioridade.”* — Denis  

> *“Separador não atualiza pedido — isso é nós (admin).”* — Denis  

> *“Totem: cliente define pagamento; caixa não muda — volta no totem.”* — Denis/Vinícius  

> *“Hub é a central; PDV, Totem, Operacional, Marketing são apps.”* — Vinícius  

> *“Preciso da base de itens antes — migração do outro sistema.”* — ambos  

---

## 16. Próximo passo recomendado (sem código)

1. Denis validar **§4 Máquina de estados** e **§13 Checklist** (15 min).
2. Reunião com sócio: confirmar **Onda 0 + Onda 1** como escopo dos 45 dias.
3. Transformar Onda 1 em épicos Notion/tarefas (pedidos, separação tablet, RLS).
4. Decidir se **imagem produto** sobe da Fase 2 para Onda 1.
5. Documento de **migração** (produtos, clientes, pedidos abertos?) — plano à parte.

---

*Documento gerado a partir da transcrição da reunião. Não substitui `ARCHITECTURE.md`; use os dois juntos e atualize o architecture quando o escopo da Fase 1 for renegociado.*
