# Checklist — só você pode fazer

Itens que exigem sua conta, senha ou decisão de negócio.

## 1. Usuários (login por **Usuário** + senha)

Na tela de login entra o campo **`login`** (ex.: `Vinicius`), não o e-mail. O Supabase Auth usa um e-mail técnico (`*@hub.ligeirinho.com`).

1. [Supabase Dashboard](https://supabase.com/dashboard/project/liszpwocwvkytzyaxvit/auth/users) → **Add user** com o e-mail técnico e senha.
2. **Table Editor** → `usuarios` → preencha `login` (único, ex.: `Vinicius`), `nome`, `cargo` e `ativo`.

O trigger `on_auth_user_created` cria a linha em `usuarios`; confira `login` e `cargo`.

| Login (tela) | E-mail Auth | Observação |
|--------------|-------------|------------|
| Nexus | nexus@hub.ligeirinho.com | Admin |
| Denis | denis@hubligeirinho.com | |
| Rafael | rafaelcavalcante@hub.ligeirinho.com | Admin |
| Vinicius | viniciusdemorais@hub.ligeirinho.com | Senha exemplo: `123456` |

## 2. URLs de redirect (Auth)

**Authentication → URL Configuration:**

| Campo | Valor |
|-------|--------|
| Site URL | `https://ligeirinhohub.vercel.app` |
| Redirect URLs | `http://localhost:4173/**` |
| | `https://ligeirinhohub.vercel.app/**` |

## 3. Git remoto + deploy automático (opcional)

- Criar repositório no GitHub/GitLab.
- `git remote add origin <url>` e push.
- Na Vercel: **Settings → Git** → conectar o repo (deploy em cada push).

## 4. Testar localmente

```bash
cd ligeirinhohub
npm run dev
```

Abrir http://localhost:4173 e entrar com o usuário criado no passo 1.
