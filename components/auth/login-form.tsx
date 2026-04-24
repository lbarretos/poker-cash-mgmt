"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Coins } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError("Email ou senha incorretos.")
        return
      }

      if (!data.user || !data.session) {
        setError("Resposta inesperada. Tente novamente.")
        return
      }

      window.location.href = "/dashboard"
    } catch {
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">

      {/* Logo mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Coins className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Poker Cash</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre na sua conta</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl text-[15px] placeholder:text-muted-foreground/60"
              autoComplete="email"
              autoFocus
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl text-[15px] placeholder:text-muted-foreground/60 pr-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-0 bg-destructive/8 rounded-xl py-2.5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl text-[15px] font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : "Entrar"
            }
          </Button>
        </form>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-muted-foreground/70">
            Quer criar uma conta por diversão?{" "}
            <a
              href="mailto:l.barretos@outlook.com"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Clique aqui para me pedir um registro.
            </a>
          </p>
        </div>
      </div>

    </div>
  )
}
