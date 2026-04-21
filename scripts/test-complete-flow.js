const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser(email, password) {
  try {
    console.log(`\n👤 Criando usuário de teste: ${email}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando fazer login...')
        return await testLogin(email, password)
      }
      console.error('❌ Erro ao criar usuário:', error.message)
      return null
    }
    
    if (data.user) {
      console.log('✅ Usuário criado com sucesso!')
      console.log('🆔 User ID:', data.user.id)
      console.log('📧 Email:', data.user.email)
      console.log('📧 Confirmação necessária:', !data.session ? 'Sim' : 'Não')
      
      if (!data.session) {
        console.log('⚠️ Usuário criado mas sem sessão (precisa confirmar email)')
        console.log('💡 Para desenvolvimento, vamos tentar fazer login direto...')
        
        // Em desenvolvimento, tentar login mesmo sem confirmação
        return await testLogin(email, password)
      }
      
      return data
    }
    
    return null
  } catch (err) {
    console.error('❌ Erro geral ao criar usuário:', err.message)
    return null
  }
}

async function testLogin(email, password) {
  try {
    console.log(`\n🔐 Testando login: ${email}`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('❌ Erro no login:', error.message)
      return null
    }
    
    if (data.user && data.session) {
      console.log('✅ Login bem-sucedido!')
      console.log('🆔 User ID:', data.user.id)
      console.log('📧 Email:', data.user.email)
      console.log('🔐 Session:', data.session ? 'Ativa' : 'Nenhuma')
      return data
    }
    
    return null
  } catch (err) {
    console.error('❌ Erro geral no login:', err.message)
    return null
  }
}

async function createTestSession(userId) {
  try {
    console.log('\n🎲 Criando sessão de poker de teste...')
    
    const sessionData = {
      name: `Sessão de Teste ${new Date().toLocaleDateString('pt-BR')}`,
      status: 'active',
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar sessão:', error.message)
      return null
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sessão criada com sucesso!')
      console.log('🆔 Session ID:', data[0].id)
      console.log('📝 Nome:', data[0].name)
      console.log('📊 Status:', data[0].status)
      return data[0]
    }
    
    return null
  } catch (err) {
    console.error('❌ Erro geral ao criar sessão:', err.message)
    return null
  }
}

async function createTestPlayer(userId) {
  try {
    console.log('\n👥 Criando jogador de teste...')
    
    const playerData = {
      name: 'Jogador Teste',
      email: 'jogador@teste.com',
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('players')
      .insert([playerData])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar jogador:', error.message)
      return null
    }
    
    if (data && data.length > 0) {
      console.log('✅ Jogador criado com sucesso!')
      console.log('🆔 Player ID:', data[0].id)
      console.log('👤 Nome:', data[0].name)
      return data[0]
    }
    
    return null
  } catch (err) {
    console.error('❌ Erro geral ao criar jogador:', err.message)
    return null
  }
}

async function createTestTransaction(sessionId, playerId, userId) {
  try {
    console.log('\n💰 Criando transação de teste...')
    
    const transactionData = {
      session_id: sessionId,
      player_id: playerId,
      type: 'buy-in',
      amount: 100.00,
      description: 'Buy-in inicial de teste',
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar transação:', error.message)
      return null
    }
    
    if (data && data.length > 0) {
      console.log('✅ Transação criada com sucesso!')
      console.log('🆔 Transaction ID:', data[0].id)
      console.log('💵 Valor:', `R$ ${data[0].amount}`)
      console.log('📝 Tipo:', data[0].type)
      console.log('📄 Descrição:', data[0].description)
      return data[0]
    }
    
    return null
  } catch (err) {
    console.error('❌ Erro geral ao criar transação:', err.message)
    return null
  }
}

async function cleanup(sessionId, playerId, transactionId) {
  try {
    console.log('\n🧹 Limpando dados de teste...')
    
    if (transactionId) {
      await supabase.from('transactions').delete().eq('id', transactionId)
      console.log('✅ Transação removida')
    }
    
    if (sessionId) {
      await supabase.from('sessions').delete().eq('id', sessionId)
      console.log('✅ Sessão removida')
    }
    
    if (playerId) {
      await supabase.from('players').delete().eq('id', playerId)
      console.log('✅ Jogador removido')
    }
    
  } catch (err) {
    console.error('⚠️ Erro na limpeza:', err.message)
  }
}

async function main() {
  console.log('🚀 Iniciando teste completo do fluxo...\n')
  
  const testEmail = process.argv[2] || 'teste@poker.com'
  const testPassword = process.argv[3] || process.env.TEST_PASSWORD || 'INSIRA_SENHA_AQUI'
  
  console.log(`📧 Email de teste: ${testEmail}`)
  console.log(`🔑 Senha de teste: ${testPassword}`)
  
  // 1. Criar ou fazer login do usuário
  let authData = await createTestUser(testEmail, testPassword)
  
  if (!authData || !authData.user) {
    console.log('\n❌ Falha na autenticação. Abortando teste.')
    return
  }
  
  const userId = authData.user.id
  console.log(`\n✅ Usuário autenticado: ${userId}`)
  
  let sessionData = null
  let playerData = null
  let transactionData = null
  
  try {
    // 2. Criar sessão de teste
    sessionData = await createTestSession(userId)
    if (!sessionData) {
      console.log('\n❌ Falha ao criar sessão. Abortando teste.')
      return
    }
    
    // 3. Criar jogador de teste
    playerData = await createTestPlayer(userId)
    if (!playerData) {
      console.log('\n❌ Falha ao criar jogador. Abortando teste.')
      return
    }
    
    // 4. Criar transação de teste
    transactionData = await createTestTransaction(sessionData.id, playerData.id, userId)
    if (!transactionData) {
      console.log('\n❌ Falha ao criar transação. Abortando teste.')
      return
    }
    
    console.log('\n🎉 TESTE COMPLETO REALIZADO COM SUCESSO!')
    console.log('📊 Resumo:')
    console.log(`   👤 Usuário: ${authData.user.email} (${authData.user.id})`)
    console.log(`   🎲 Sessão: ${sessionData.name} (${sessionData.id})`)
    console.log(`   👥 Jogador: ${playerData.name} (${playerData.id})`)
    console.log(`   💰 Transação: ${transactionData.type} R$ ${transactionData.amount} (${transactionData.id})`)
    
    // 5. Opcional: limpar dados de teste
    const shouldCleanup = process.argv.includes('--cleanup')
    if (shouldCleanup) {
      await cleanup(sessionData.id, playerData.id, transactionData.id)
      console.log('\n✅ Dados de teste removidos')
    } else {
      console.log('\n💡 Para limpar os dados de teste, execute com --cleanup')
    }
    
  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error)
    
    // Tentar limpar os dados criados
    if (sessionData || playerData || transactionData) {
      console.log('\n🧹 Tentando limpar dados parciais...')
      await cleanup(
        sessionData?.id,
        playerData?.id,
        transactionData?.id
      )
    }
  }
}

main().catch(console.error) 