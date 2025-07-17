# Configuração do Projeto

## Variáveis de Ambiente

Para executar este projeto, você precisa configurar as seguintes variáveis de ambiente no arquivo `.env.local`:

```env
# Configuração do Supabase
# Obtenha essas informações no dashboard do seu projeto Supabase

# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Chave pública (anon key) do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Senha para testes (opcional - apenas para desenvolvimento)
TEST_PASSWORD=your-test-password-here
```

## Como obter as credenciais do Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para Settings > API
4. Copie a URL do projeto e a chave pública (anon key)
5. Configure as variáveis no arquivo `.env.local`

## Configuração do Banco de Dados

Execute o script SQL em `setup-database.sql` no editor SQL do Supabase para criar as tabelas necessárias.

## Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Segurança

- **NUNCA** commite o arquivo `.env.local`
- As variáveis `NEXT_PUBLIC_*` são expostas no frontend
- Use apenas a chave pública (anon key) no frontend
- Configure as políticas RLS no Supabase para segurança 