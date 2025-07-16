const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLoginFlow(email, password) {
  console.log(`🔍 Testando fluxo de login para: ${email}\n`)

  try {
    // 1. Verificar sessão inicial
    console.log('1️⃣ Verificando sessão inicial...')
    const { data: { session: initialSession } } = await supabase.auth.getSession()
    console.log('   - Sessão inicial:', initialSession ? 'EXISTE' : 'NENHUMA')
    if (initialSession) {
      console.log('   - Usuário inicial:', initialSession.user.email)
    }

    // 2. Fazer logout se já logado
    if (initialSession) {
      console.log('\n2️⃣ Fazendo logout da sessão existente...')
      await supabase.auth.signOut()
      console.log('   - Logout realizado')
    }

    // 3. Tentar login
    console.log('\n3️⃣ Fazendo login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Erro no login:', error.message)
      return false
    }

    if (!data.user || !data.session) {
      console.error('❌ Login não retornou usuário ou sessão')
      return false
    }

    console.log('✅ Login bem-sucedido!')
    console.log('   - Usuário:', data.user.email)
    console.log('   - User ID:', data.user.id)
    console.log('   - Access Token (20 chars):', data.session.access_token.substring(0, 20) + '...')
    console.log('   - Refresh Token (20 chars):', data.session.refresh_token.substring(0, 20) + '...')
    console.log('   - Expires at:', new Date(data.session.expires_at * 1000).toLocaleString('pt-BR'))

    // 4. Aguardar e verificar sessão múltiplas vezes
    console.log('\n4️⃣ Verificando persistência da sessão...')
    
    for (let i = 1; i <= 5; i++) {
      console.log(`\n   Verificação ${i}/5:`)
      await new Promise(resolve => setTimeout(resolve, 500)) // Aguardar 500ms
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.log('   ❌ Erro ao verificar sessão:', sessionError.message)
        continue
      }
      
      if (session) {
        console.log('   ✅ Sessão encontrada')
        console.log('   - Usuário:', session.user.email)
        console.log('   - Ainda válida:', new Date(session.expires_at * 1000) > new Date() ? 'SIM' : 'NÃO')
      } else {
        console.log('   ❌ Sessão NÃO encontrada')
      }
    }

    // 5. Testar refresh
    console.log('\n5️⃣ Testando refresh da sessão...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.log('❌ Erro no refresh:', refreshError.message)
    } else if (refreshData.session) {
      console.log('✅ Refresh bem-sucedido')
      console.log('   - Novo access token (20 chars):', refreshData.session.access_token.substring(0, 20) + '...')
    }

    // 6. Verificar user
    console.log('\n6️⃣ Verificando getUser()...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message)
    } else if (user) {
      console.log('✅ Usuário encontrado')
      console.log('   - Email:', user.email)
      console.log('   - ID:', user.id)
    } else {
      console.log('❌ Usuário NÃO encontrado')
    }

    // 7. Fazer logout final
    console.log('\n7️⃣ Fazendo logout final...')
    const { error: logoutError } = await supabase.auth.signOut()
    
    if (logoutError) {
      console.log('❌ Erro no logout:', logoutError.message)
    } else {
      console.log('✅ Logout realizado')
    }

    // 8. Verificar se logout funcionou
    console.log('\n8️⃣ Verificando se logout funcionou...')
    const { data: { session: finalSession } } = await supabase.auth.getSession()
    console.log('   - Sessão final:', finalSession ? 'AINDA EXISTE' : 'REMOVIDA')

    return true

  } catch (err) {
    console.error('💥 Erro geral:', err)
    return false
  }
}

async function main() {
  console.log('🚀 Teste do Fluxo de Login Supabase\n')
  
  const email = process.argv[2] || 'teste@poker.com'
  const password = process.argv[3] || process.env.TEST_PASSWORD || 'INSIRA_SENHA_AQUI'
  
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${'*'.repeat(password.length)}\n`)
  
  const success = await testLoginFlow(email, password)
  
  if (success) {
    console.log('\n🎉 Teste do fluxo de login concluído!')
    console.log('\n💡 Agora tente fazer login na interface web e observe os logs.')
  } else {
    console.log('\n❌ Teste do fluxo de login falhou!')
  }
}

main().catch(console.error) 