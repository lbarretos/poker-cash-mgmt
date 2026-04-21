import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('🔍 MIDDLEWARE: Processando rota:', pathname)
  
  // Verificar se as variáveis de ambiente estão definidas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ MIDDLEWARE: Missing Supabase environment variables')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          const authCookies = cookies.filter(cookie => 
            cookie.name.includes('supabase') || 
            cookie.name.includes('auth') ||
            cookie.name.includes('sb-')
          )
          console.log('🍪 MIDDLEWARE: Cookies de auth encontrados:', authCookies.length)
          authCookies.forEach(cookie => {
            console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`)
          })
          return cookies
        },
        setAll(cookiesToSet) {
          console.log('📝 MIDDLEWARE: Definindo cookies:', cookiesToSet.length)
          cookiesToSet.forEach(({ name, value }) => {
            console.log(`   - Definindo: ${name}`)
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    // Obter a sessão atual
    console.log('🔄 MIDDLEWARE: Verificando sessão...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ MIDDLEWARE: Erro ao verificar sessão:', error.message)
    }

    console.log('📊 MIDDLEWARE: Resultado da sessão:')
    console.log('   - Sessão encontrada:', session ? 'SIM' : 'NÃO')
    if (session) {
      console.log('   - Usuário:', session.user.email)
      console.log('   - Expires at:', new Date(session.expires_at! * 1000).toLocaleString('pt-BR'))
      // Token log removido por segurança
    }

    const isAuthPage = pathname === '/login'
    const isProtectedPage = pathname.startsWith('/dashboard')

    // Se usuário está logado e tenta acessar /login, redirecionar para dashboard
    if (session && isAuthPage) {
      console.log('✅ MIDDLEWARE: Usuário logado tentando acessar login, redirecionando para dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Se usuário não está logado e tenta acessar página protegida, redirecionar para login
    if (!session && isProtectedPage) {
      console.log('🚫 MIDDLEWARE: Sem sessão, redirecionando para /login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('✅ MIDDLEWARE: Fluxo autorizado, continuando...')
  } catch (error) {
    console.error('💥 MIDDLEWARE: Erro geral:', error)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
} 