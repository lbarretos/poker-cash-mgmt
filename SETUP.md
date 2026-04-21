# Setup

## Pré-requisitos

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Conta no [Supabase](https://supabase.com) (free tier é suficiente)
- Conta no [Vercel](https://vercel.com) (opcional, para deploy)

---

## 1. Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha um nome e região (recomendado: `sa-east-1` para Brasil)
3. Aguarde o projeto inicializar (~2 min)

### 1.2 Criar as tabelas

1. No dashboard do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo de `setup-database.sql`

Isso cria 4 tabelas (`sessions`, `players`, `transactions`, `chip_types`) com RLS habilitado e todas as políticas de segurança por usuário.

### 1.3 Obter credenciais

Em **Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

> `.env.local` está no `.gitignore` — nunca commite esse arquivo.

---

## 3. Instalação e desenvolvimento

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`. Na primeira vez, crie uma conta pelo formulário de login.

---

## 4. Deploy no Vercel

### Via GitHub (recomendado)

1. Faça fork ou clone do repositório no GitHub
2. No [Vercel](https://vercel.com), clique em **Add New Project** e importe o repositório
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

### Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Criar conta de usuário

O sistema usa autenticação do Supabase. Após o deploy:

1. Acesse a URL do seu app
2. Faça signup com email e senha
3. Seus dados ficam isolados dos de outros usuários via RLS

Para criar usuários adicionais, vá em **Authentication → Users** no dashboard do Supabase.

---

## Notas de segurança

- A `anon key` é pública por design — ela é embutida no bundle JS do Next.js e dá acesso apenas ao que as políticas RLS permitem
- Cada usuário só acessa seus próprios dados (sessions, players, transactions, chip_types)
- Nunca use a `service_role` key no frontend
