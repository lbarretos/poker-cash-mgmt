-- Script para adicionar a coluna 'notes' na tabela players
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela players existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        RAISE EXCEPTION 'Tabela players não existe! Execute primeiro o script setup-database.sql';
    END IF;
    
    RAISE NOTICE 'Tabela players encontrada. Verificando estrutura...';
END $$;

-- 2. Adicionar coluna notes se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'players' AND column_name = 'notes') THEN
        ALTER TABLE players ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Coluna notes adicionada à tabela players';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna notes já existe na tabela players';
    END IF;
END $$;

-- 3. Verificar se a coluna foi adicionada com sucesso
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Estrutura atual da tabela players:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- %: % (nullable: %)', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
END $$;

-- 4. Testar inserção com a coluna notes
DO $$ 
BEGIN
    -- Tentar inserir um registro de teste (será removido em seguida)
    INSERT INTO players (name, email, phone, notes, user_id) 
    VALUES ('TESTE_MIGRAÇÃO', 'teste@migração.com', '11999999999', 'Teste da coluna notes', auth.uid());
    
    -- Verificar se a inserção funcionou
    IF EXISTS (SELECT 1 FROM players WHERE name = 'TESTE_MIGRAÇÃO') THEN
        RAISE NOTICE '✅ Teste de inserção com coluna notes: SUCESSO';
        -- Remover o registro de teste
        DELETE FROM players WHERE name = 'TESTE_MIGRAÇÃO';
        RAISE NOTICE 'ℹ️ Registro de teste removido';
    ELSE
        RAISE NOTICE '❌ Teste de inserção com coluna notes: FALHOU';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
        -- Tentar remover o registro de teste mesmo em caso de erro
        DELETE FROM players WHERE name = 'TESTE_MIGRAÇÃO' AND email = 'teste@migração.com';
END $$;

-- 5. Mensagem final
SELECT '✅ Migração concluída! A coluna notes está disponível na tabela players.' as status; 