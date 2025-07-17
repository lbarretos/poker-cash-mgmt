# Poker Cash Management System

Um sistema completo para gerenciamento de sessões de poker, jogadores, transações e acerto de contas.

## Funcionalidades

- ✅ **Gerenciamento de Sessões**: Crie e gerencie sessões de poker com múltiplas mesas
- ✅ **Controle de Jogadores**: Cadastro e gerenciamento de jogadores
- ✅ **Transações**: Controle de buy-ins, cash-outs e pagamentos
- ✅ **Acerto de Contas**: Cálculo automático de débitos e créditos
- ✅ **Gerenciamento de Fichas**: Controle de valores e cores das fichas
- ✅ **Timer de Blinds**: Sistema de timer para torneios
- ✅ **Interface Responsiva**: Otimizada para desktop e mobile
- ✅ **Autenticação**: Sistema de login seguro com Supabase

## Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Zustand
- **Deployment**: Vercel

## Configuração

Veja o arquivo [SETUP.md](./SETUP.md) para instruções detalhadas de configuração.

## Instalação Rápida

```bash
# Clone o repositório
git clone <repository-url>
cd poker-cash-mgmt

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute o projeto
npm run dev
```

## Estrutura do Projeto

```
├── app/                    # Páginas da aplicação (App Router)
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn/ui)
│   └── auth/             # Componentes de autenticação
├── lib/                  # Utilitários e configurações
├── hooks/                # Custom hooks
├── scripts/              # Scripts de teste e utilitários
├── public/               # Arquivos estáticos
└── styles/               # Estilos globais
```

## Scripts Disponíveis

- `npm run dev` - Executar em modo de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm run lint` - Executar linter

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
