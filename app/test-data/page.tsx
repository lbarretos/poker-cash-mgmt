"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Database, Users, CreditCard, Play } from "lucide-react"
import Link from "next/link"

export default function TestDataPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")

  const addResult = (type: string, success: boolean, data: any, error?: string) => {
    const result = {
      id: Date.now(),
      type,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }
    setResults(prev => [result, ...prev])
  }

  const clearResults = () => {
    setResults([])
    setError("")
  }

  const createTestSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não encontrado")

      const sessionData = {
        name: `Sessão de Teste ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
        status: 'active',
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()

      if (error) throw error

      addResult('session', true, data[0])
      return data[0]
    } catch (err: any) {
      addResult('session', false, null, err.message)
      throw err
    }
  }

  const createTestPlayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não encontrado")

      const playerData = {
        name: `Jogador Teste ${Date.now()}`,
        email: `jogador${Date.now()}@teste.com`,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('players')
        .insert([playerData])
        .select()

      if (error) throw error

      addResult('player', true, data[0])
      return data[0]
    } catch (err: any) {
      addResult('player', false, null, err.message)
      throw err
    }
  }

  const createTestTransaction = async (sessionId: string, playerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não encontrado")

      const transactionData = {
        session_id: sessionId,
        player_id: playerId,
        type: 'buy-in',
        amount: Math.floor(Math.random() * 500) + 50, // R$ 50-550
        description: 'Buy-in de teste automático',
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (error) throw error

      addResult('transaction', true, data[0])
      return data[0]
    } catch (err: any) {
      addResult('transaction', false, null, err.message)
      throw err
    }
  }

  const runCompleteTest = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("🚀 Iniciando teste completo...")

      // 1. Criar sessão
      const session = await createTestSession()
      
      // 2. Criar jogador
      const player = await createTestPlayer()
      
      // 3. Criar transação
      await createTestTransaction(session.id, player.id)

      console.log("✅ Teste completo realizado com sucesso!")
      
    } catch (err: any) {
      console.error("❌ Erro no teste:", err)
      setError(`Erro no teste completo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testUserInfo = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      addResult('user_info', true, {
        id: user?.id,
        email: user?.email,
        created_at: user?.created_at
      })
    } catch (err: any) {
      addResult('user_info', false, null, err.message)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teste de Dados</h1>
              <p className="text-gray-600">Teste a criação de dados no Supabase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controles de Teste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Controles de Teste
                </CardTitle>
                <CardDescription>
                  Execute testes individuais ou o fluxo completo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={testUserInfo}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Info Usuário
                  </Button>
                  
                  <Button
                    onClick={createTestSession}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Criar Sessão
                  </Button>
                  
                  <Button
                    onClick={createTestPlayer}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Criar Jogador
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (results.length >= 2) {
                        const session = results.find(r => r.type === 'session' && r.success)
                        const player = results.find(r => r.type === 'player' && r.success)
                        if (session && player) {
                          createTestTransaction(session.data.id, player.data.id)
                        } else {
                          setError("Crie uma sessão e um jogador primeiro")
                        }
                      } else {
                        setError("Crie uma sessão e um jogador primeiro")
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Criar Transação
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Button
                    onClick={runCompleteTest}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Executando..." : "🚀 Teste Completo"}
                  </Button>
                </div>

                <Button
                  onClick={clearResults}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Limpar Resultados
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  {results.length} teste(s) executado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhum teste executado ainda
                    </p>
                  ) : (
                    results.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={result.success ? "default" : "destructive"}
                            >
                              {result.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {result.timestamp}
                            </span>
                          </div>
                          <Badge
                            variant={result.success ? "secondary" : "destructive"}
                          >
                            {result.success ? "✅ Sucesso" : "❌ Erro"}
                          </Badge>
                        </div>
                        
                        {result.error && (
                          <p className="text-red-600 text-sm mb-2">
                            {result.error}
                          </p>
                        )}
                        
                        {result.data && (
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
} 