const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase - usando variáveis de ambiente por segurança
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('players').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase estabelecida!')
    return true
  } catch (err) {
    console.log('❌ Erro ao conectar:', err.message)
    return false
  }
}

async function createTestUser() {
  console.log('\n👤 Criando usuário de teste...')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'teste@poker.com',
      password: process.env.TEST_PASSWORD || 'INSIRA_SENHA_AQUI'
    })
    
    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message)
      return null
    }
    
    console.log('✅ Usuário criado:', data.user?.email)
    return data.user
  } catch (err) {
    console.log('❌ Erro:', err.message)
    return null
  }
}

async function loginTestUser() {
  console.log('\n🔐 Fazendo login...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'teste@poker.com',
      password: process.env.TEST_PASSWORD || 'INSIRA_SENHA_AQUI'
    })
    
    if (error) {
      console.log('❌ Erro no login:', error.message)
      return null
    }
    
    console.log('✅ Login realizado:', data.user?.email)
    return data.user
  } catch (err) {
    console.log('❌ Erro:', err.message)
    return null
  }
}

async function createTestData(user) {
  console.log('\n📊 Criando dados de teste...')
  
  try {
    // 1. Criar sessão
    console.log('📋 Criando sessão...')
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        name: 'Sessão de Teste - Script',
        status: 'active',
        table_count: 1,
        notes: 'Sessão criada via script de teste',
        user_id: user.id
      }])
      .select()

    if (sessionError) {
      console.log('❌ Erro ao criar sessão:', sessionError.message)
      return
    }

    console.log('✅ Sessão criada:', session[0].name)

    // 2. Criar jogadores
    console.log('👥 Criando jogadores...')
    const playerData = [
      { name: 'João Teste', email: 'joao@teste.com', phone: '11999999999', notes: 'Jogador teste 1', user_id: user.id },
      { name: 'Maria Teste', email: 'maria@teste.com', phone: '11888888888', notes: 'Jogadora teste 2', user_id: user.id }
    ]

    const { data: createdPlayers, error: playersError } = await supabase
      .from('players')
      .insert(playerData)
      .select()

    if (playersError) {
      console.log('❌ Erro ao criar jogadores:', playersError.message)
      return
    }

    console.log('✅ Jogadores criados:', createdPlayers.length)

    // 3. Criar transações
    console.log('💰 Criando transações...')
    const transactionData = [
      { session_id: session[0].id, player_id: createdPlayers[0].id, type: 'buy-in', amount: 200, notes: 'Buy-in inicial', user_id: user.id },
      { session_id: session[0].id, player_id: createdPlayers[1].id, type: 'buy-in', amount: 150, notes: 'Buy-in inicial', user_id: user.id },
      { session_id: session[0].id, player_id: createdPlayers[0].id, type: 'cash-out', amount: 350, notes: 'Cash-out com lucro', user_id: user.id },
      { session_id: session[0].id, player_id: createdPlayers[1].id, type: 'cash-out', amount: 80, notes: 'Cash-out com prejuízo', user_id: user.id }
    ]

    const { data: createdTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()

    if (transactionsError) {
      console.log('❌ Erro ao criar transações:', transactionsError.message)
      return
    }

    console.log('✅ Transações criadas:', createdTransactions.length)

    // 4. Verificar dados criados
    console.log('\n📈 Verificando dados criados...')
    
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)

    const { data: allPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)

    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)

    console.log(`📊 Resumo dos dados criados:`)
    console.log(`   - Sessões: ${allSessions?.length || 0}`)
    console.log(`   - Jogadores: ${allPlayers?.length || 0}`)
    console.log(`   - Transações: ${allTransactions?.length || 0}`)

    return { sessions: allSessions, players: allPlayers, transactions: allTransactions }

  } catch (err) {
    console.log('❌ Erro geral:', err.message)
  }
}

async function main() {
  console.log('🚀 Iniciando teste do Supabase...\n')

  // 1. Testar conexão
  const connected = await testSupabaseConnection()
  if (!connected) {
    console.log('❌ Falha na conexão. Abortando teste.')
    return
  }

  // 2. Criar usuário (opcional - pode já existir)
  // const user = await createTestUser()
  
  // 3. Fazer login
  const user = await loginTestUser()
  if (!user) {
    console.log('❌ Falha no login. Abortando teste.')
    return
  }

  // 4. Criar dados de teste
  const testData = await createTestData(user)
  
  if (testData) {
    console.log('\n🎉 Teste concluído com sucesso!')
    console.log('📋 Dados criados no Supabase:')
    console.log('   - Sessão: "Sessão de Teste - Script"')
    console.log('   - Jogadores: João Teste, Maria Teste')
    console.log('   - Transações: 4 transações (2 buy-ins, 2 cash-outs)')
    console.log('\n🔍 Verifique no painel do Supabase:')
    console.log('   - Table Editor > sessions')
    console.log('   - Table Editor > players')
    console.log('   - Table Editor > transactions')
  } else {
    console.log('\n❌ Teste falhou!')
  }
}

// Executar o teste
main().catch(console.error) 