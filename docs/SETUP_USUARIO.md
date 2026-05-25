# Checklist — só você pode fazer

Itens que exigem sua conta, senha ou decisão de negócio.

## 1. Primeiro usuário (Supabase Auth)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/liszpwocwvkytzyaxvit/auth/users) → **Add user** (e-mail + senha).
2. **Table Editor** → `usuarios` → altere `cargo` para `Administrador` ou `Desenvolvedor`.

O trigger `on_auth_user_created` já cria a linha em `usuarios` automaticamente.

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
