"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 AUTH GUARD: Verificando autenticação...")
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("❌ AUTH GUARD: Erro ao verificar sessão:", error.message)
          // Auto-logout em caso de erro
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        if (session) {
          console.log("✅ AUTH GUARD: Usuário autenticado:", session.user.email)
          setAuthenticated(true)
        } else {
          console.log("🚫 AUTH GUARD: Usuário não autenticado, redirecionando...")
          router.push("/login")
        }
      } catch (err) {
        console.error("💥 AUTH GUARD: Erro geral:", err)
        // Auto-logout em caso de erro crítico
        await supabase.auth.signOut()
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    // Verificar auth na inicialização
    checkAuth()

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AUTH GUARD: Mudança de estado:", event)
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("👋 AUTH GUARD: Usuário deslogado")
        setAuthenticated(false)
        router.push("/login")
      } else if (event === 'SIGNED_IN' && session) {
        console.log("👋 AUTH GUARD: Usuário logado:", session.user.email)
        setAuthenticated(true)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("🔄 AUTH GUARD: Token renovado")
        setAuthenticated(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
} 