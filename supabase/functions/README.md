# Edge Functions — NFC-e (Ligeirinho PDV)

Funções para emissão fiscal NFC-e (modelo 65) via provedor **Nuvem Fiscal**.

- `nfce-emitir` — emite a NFC-e de um pedido e grava o retorno em `pedidos`.
- `nfce-consultar` — reconsulta o status de uma NFC-e já enviada.
- `nfce-cancelar` — cancela uma NFC-e autorizada (justificativa ≥ 15 caracteres).

## Pré-requisitos (uma vez)

1. Conta na Nuvem Fiscal e credenciais OAuth (`client_id` / `client_secret`).
2. Empresa cadastrada na Nuvem Fiscal com:
   - Certificado digital A1 enviado.
   - Inscrição Estadual e CSC/idCSC de NFC-e configurados.
3. Começar em **homologação** antes de produção.

## Segredos (Supabase)

```bash
supabase secrets set \
  NUVEM_FISCAL_CLIENT_ID=xxxx \
  NUVEM_FISCAL_CLIENT_SECRET=xxxx \
  NFCE_AMBIENTE=homologacao \
  EMITENTE_CPF_CNPJ=00000000000000 \
  EMITENTE_CRT=1 \
  NFCE_SERIE=1 \
  NFCE_CUF=35 \
  EMITENTE_CMUN=3550308 \
  NFCE_CFOP_PADRAO=5102 \
  NFCE_NCM_PADRAO=22030000 \
  NFCE_CSOSN_PADRAO=102 \
  NFCE_ORIGEM_PADRAO=0
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados pelo runtime.

## Deploy

```bash
supabase functions deploy nfce-emitir
supabase functions deploy nfce-consultar
supabase functions deploy nfce-cancelar
```

## Observações fiscais

O `montarPayloadNfce` (em `_shared/nuvemFiscal.ts`) usa NCM/CFOP/CSOSN padrão por
variável de ambiente. Para tributação correta por item, o ideal é evoluir a tabela
`produtos` com campos fiscais (NCM, CFOP, CST/CSOSN, origem) e mapeá-los no payload.
