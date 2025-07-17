-- Script para configurar o banco de dados do Poker Cash Management
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de tipos de fichas
CREATE TABLE IF NOT EXISTS chip_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    color VARCHAR(50),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('buy-in', 'cash-out', 'payment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_player_id ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chip_types_user_id ON chip_types(user_id);

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chip_types ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para sessions
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Criar políticas RLS para players
CREATE POLICY "Users can view their own players" ON players
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON players
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Criar políticas RLS para transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Criar políticas RLS para chip_types
CREATE POLICY "Users can view their own chip types" ON chip_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chip types" ON chip_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chip types" ON chip_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chip types" ON chip_types
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Criar triggers para atualizar updated_at
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chip_types_updated_at BEFORE UPDATE ON chip_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Adicionar campo notes na tabela players se não existir (para bancos existentes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'players' AND column_name = 'notes') THEN
        ALTER TABLE players ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 14. Atualizar constraint da tabela transactions para incluir 'payment' (para bancos existentes)
DO $$ 
BEGIN
    -- Remove constraint existente se houver
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    -- Adiciona nova constraint com payment
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('buy-in', 'cash-out', 'payment'));
EXCEPTION
    WHEN OTHERS THEN
        -- Ignora erro se a constraint já existe
        NULL;
END $$;

-- 15. Verificação e correção da estrutura da tabela players
DO $$ 
BEGIN
    -- Verificar se todas as colunas necessárias existem
    RAISE NOTICE 'Verificando estrutura da tabela players...';
    
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        RAISE EXCEPTION 'Tabela players não existe!';
    END IF;
    
    -- Listar colunas existentes
    RAISE NOTICE 'Colunas na tabela players:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- %: % (nullable: %)', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
    
    RAISE NOTICE 'Verificação da tabela players concluída.';
END $$;

-- 16. Inserir dados de exemplo para chip_types (opcional)
INSERT INTO chip_types (name, value, color, user_id) VALUES
    ('Ficha R$1', 1.00, 'Branca', auth.uid()),
    ('Ficha R$5', 5.00, 'Vermelha', auth.uid()),
    ('Ficha R$25', 25.00, 'Verde', auth.uid()),
    ('Ficha R$100', 100.00, 'Preta', auth.uid())
ON CONFLICT DO NOTHING;

-- 17. Script de diagnóstico (execute separadamente se houver problemas)
/*
-- Verificar permissões RLS na tabela players
SELECT schemaname, tablename, rowsecurity, enablerls 
FROM pg_tables 
WHERE tablename = 'players';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'players';

-- Testar inserção manual (substitua USER_ID_AQUI pelo seu user ID)
-- INSERT INTO players (name, email, phone, notes, user_id) 
-- VALUES ('Teste Manual', 'teste@example.com', '11999999999', 'Teste', 'USER_ID_AQUI');
*/

-- Mensagem final
DO $$ 
BEGIN
    RAISE NOTICE '✅ Setup do banco de dados concluído com sucesso!';
    RAISE NOTICE 'Se houver problemas com jogadores, verifique:';
    RAISE NOTICE '1. Se o campo notes foi adicionado corretamente';
    RAISE NOTICE '2. Se as políticas RLS estão funcionando';
    RAISE NOTICE '3. Use a página /debug-data para diagnóstico';
END $$;
SELECT 'Database setup completed successfully!' as status; 