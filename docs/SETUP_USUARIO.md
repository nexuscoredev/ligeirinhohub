# Checklist — só você pode fazer

Itens que exigem sua conta, senha ou decisão de negócio.

## 1. Usuários (login por **Usuário** + senha)

Na tela de login entra o campo **`login`** (ex.: `Vinicius`), não o e-mail. O Supabase Auth usa um e-mail técnico (`*@hub.ligeirinho.com`).

1. [Supabase Dashboard](https://supabase.com/dashboard/project/liszpwocwvkytzyaxvit/auth/users) → **Add user** com o e-mail técnico e senha.
2. **Table Editor** → `usuarios` → preencha `login` (único, ex.: `Vinicius`), `nome`, `cargo` e `ativo`.

O trigger `on_auth_user_created` cria a linha em `usuarios`; confira `login` e `cargo`.

**Senha atual (todos os usuários abaixo):** `123456`

| Login (tela) | E-mail Auth | Cargo |
|--------------|-------------|-------|
| Nexus | nexus@hub.ligeirinho.com | Administrador |
| Denis | denis@hubligeirinho.com | Gerente |
| Rafael | rafaelcavalcante@hub.ligeirinho.com | Administrador |
| Vinicius | viniciusdemorais@hub.ligeirinho.com | Administrador |
| Denise | denise@hub.ligeirinho.com | Gerente |
| Patricia | patricia@hub.ligeirinho.com | Gerente |
| Geovanna | geovanna@hub.ligeirinho.com | Gerente |

### Criar usuário via SQL (cuidado)

Prefira **Add user** no Dashboard. Se criar em `auth.users` por SQL, o login **falha** se faltar algum destes itens:

1. **Tokens vazios** (não `NULL`): `confirmation_token`, `email_change`, `email_change_token_new`, `recovery_token` → use `''`.
2. **Senha**: `extensions.crypt('sua_senha', extensions.gen_salt('bf'))` em `encrypted_password`.
3. **Identidade**: linha em `auth.identities` com `provider = 'email'` e `identity_data` com `sub` + `email`.
4. **Perfil**: `login` em `public.usuarios` (ex.: `Vinicius`) igual ao que a pessoa digita na tela.

Exemplo ao corrigir senha/tokens de um usuário existente:

```sql
UPDATE auth.users SET
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now())
WHERE email = 'viniciusdemorais@hub.ligeirinho.com';
```

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
