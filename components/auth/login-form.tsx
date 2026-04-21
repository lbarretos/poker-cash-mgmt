"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, Mail, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DebugSession } from "@/components/debug-session"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    console.log("🔍 Iniciando processo de login para:", email)
    
    try {
      // 1. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (error) {
        console.error("🚨 Erro no login:", error.message)
        setError(`Erro: ${error.message}`)
        return
      }

      if (!data.user || !data.session) {
        console.warn("⚠️ Login retornou sem usuário ou sessão")
        setError("Resposta inesperada do servidor. Tente novamente.")
        return
      }

      console.log("✅ Login bem-sucedido para:", data.user.email)
      // Token log removido por segurança
      
      setSuccess("Login realizado com sucesso! Redirecionando...")

      // 2. Aguardar um momento e forçar redirecionamento via location
      console.log("🚀 Redirecionando via window.location...")
      setTimeout(() => {
        // Usar window.location.href para forçar uma nova requisição completa
        window.location.href = "/dashboard"
      }, 1500)

    } catch (err) {
      console.error("💥 Erro geral:", err)
      setError(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso ao Dashboard</CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar o gerenciador de poker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Primeira vez? Crie sua conta no Supabase primeiro.
              </p>
              {/* Email de teste removido por segurança */}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Componente de debug para monitorar sessão */}
      <DebugSession />
    </>
  )
} 