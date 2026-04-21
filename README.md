# Poker Cash Management

Sistema para gerenciamento de sessões de poker cash game: jogadores, buy-ins, cash-outs, fichas e acerto de contas.

## Funcionalidades

- **Sessões** — crie e acompanhe sessões de poker (ativas ou concluídas)
- **Jogadores** — cadastro com email, telefone e notas
- **Transações** — buy-ins, cash-outs, pagamentos e consumação (divisão automática de custos)
- **Fichas** — configure tipos, cores e valores; recontagem manual
- **Acerto de contas** — algoritmo que minimiza o número de pagamentos entre jogadores
- **Timer** — timer de blinds para torneios com estrutura configurável
- **Multi-usuário** — cada conta vê apenas seus próprios dados (RLS no Supabase)
- **Responsivo** — otimizado para desktop e mobile

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Estado:** Zustand (store único com chamadas diretas ao Supabase)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel

## Setup rápido

```bash
git clone https://github.com/lbarretos/poker-cash-mgmt.git
cd poker-cash-mgmt
pnpm install
cp .env.example .env.local   # preencha com suas credenciais do Supabase
pnpm dev
```

> Requer **pnpm**. Instale com `npm install -g pnpm` se necessário.

Veja [SETUP.md](./SETUP.md) para instruções completas de configuração do Supabase e deploy no Vercel.

## Scripts

```bash
pnpm dev      # desenvolvimento
pnpm build    # build de produção
pnpm start    # rodar build localmente
pnpm lint     # ESLint
```
