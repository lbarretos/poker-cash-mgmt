const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Verificar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testando configuração do Supabase...')
console.log('🌐 URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada')
console.log('🔑 Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  try {
    console.log('\n🔄 Testando conexão com Supabase...')
    
    // Testar conexão básica usando uma tabela que sempre existe
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    console.log('📊 Sessão atual:', data.session ? 'Ativa' : 'Nenhuma')
    return true
  } catch (err) {
    console.error('❌ Erro geral:', err.message)
    return false
  }
}

async function testAuthentication(email, password) {
  try {
    console.log(`\n🔐 Testando autenticação para: ${email}`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('❌ Erro na autenticação:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('✅ Autenticação bem-sucedida!')
      console.log('👤 Usuário:', data.user.email)
      console.log('🆔 User ID:', data.user.id)
      console.log('📧 Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não')
      return true
    } else {
      console.log('⚠️ Resposta sem usuário')
      return false
    }
  } catch (err) {
    console.error('❌ Erro geral na autenticação:', err.message)
    return false
  }
}

async function testDatabaseTables() {
  try {
    console.log('\n🗄️ Testando acesso às tabelas do banco...')
    
    // Testar se as tabelas existem
    const tables = ['sessions', 'players', 'transactions', 'chip_types']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabela ${table}: Acessível`)
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`)
      }
    }
  } catch (err) {
    console.error('❌ Erro ao testar tabelas:', err.message)
  }
}

async function main() {
  console.log('🚀 Iniciando testes do Supabase...\n')
  
  // Testar conexão
  const connectionOk = await testSupabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Falha na conexão. Verifique suas credenciais.')
    return
  }
  
  // Testar tabelas do banco
  await testDatabaseTables()
  
  // Testar autenticação se credenciais fornecidas
  if (process.argv.length >= 4) {
    const testEmail = process.argv[2]
    const testPassword = process.argv[3]
    
    const authOk = await testAuthentication(testEmail, testPassword)
    
    if (authOk) {
      console.log('\n✅ Todos os testes passaram!')
    } else {
      console.log('\n❌ Falha na autenticação. Verifique email e senha.')
    }
  } else {
    console.log('\n💡 Para testar autenticação, use:')
    console.log('node test-supabase-auth.js seu@email.com suasenha')
  }
}

main().catch(console.error) 