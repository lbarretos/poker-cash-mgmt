import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    const isAuthPage = pathname === '/login'
    const isProtectedPage = pathname.startsWith('/dashboard')

    if (session && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!session && isProtectedPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch {
    // silently fail — user will be redirected by AuthGuard on the client
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
