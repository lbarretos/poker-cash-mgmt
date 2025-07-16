"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, RefreshCw, LogOut } from "lucide-react"
import Link from "next/link"

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestEnvironmentPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)

  const addResult = (name: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { name, status, message, details }])
  }

  const clearResults = () => {
    setResults([])
  }

  const testEnvironmentVariables = () => {
    console.log("🧪 Testando variáveis de ambiente...")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      addResult(
        'Environment Variables',
        'success',
        'Variáveis de ambiente configuradas corretamente',
        { url: supabaseUrl, hasKey: !!supabaseAnonKey }
      )
    } else {
      addResult(
        'Environment Variables',
        'error',
        'Variáveis de ambiente não configuradas',
        { url: supabaseUrl, hasKey: !!supabaseAnonKey }
      )
    }
  }

  const testSupabaseConnection = async () => {
    try {
      console.log("🧪 Testando conexão com Supabase...")
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        addResult('Supabase Connection', 'error', `Erro na conexão: ${error.message}`)
      } else {
        addResult('Supabase Connection', 'success', 'Conexão com Supabase estabelecida')
      }
    } catch (err: any) {
      addResult('Supabase Connection', 'error', `Erro: ${err.message}`)
    }
  }

  const testAuthentication = async () => {
    try {
      console.log("🧪 Testando autenticação...")
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        addResult('Authentication', 'error', `Erro na autenticação: ${error.message}`)
      } else if (user) {
        setUserInfo(user)
        addResult(
          'Authentication',
          'success',
          `Usuário autenticado: ${user.email}`,
          { id: user.id, email: user.email }
        )
      } else {
        addResult('Authentication', 'warning', 'Nenhum usuário autenticado')
      }
    } catch (err: any) {
      addResult('Authentication', 'error', `Erro: ${err.message}`)
    }
  }

  const testDatabaseTables = async () => {
    console.log("🧪 Testando acesso às tabelas...")
    
    const tables = [
      { name: 'sessions', label: 'Sessões' },
      { name: 'players', label: 'Jogadores' },
      { name: 'transactions', label: 'Transações' },
      { name: 'chip_types', label: 'Tipos de Fichas' }
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('count')
          .limit(1)
        
        if (error) {
          addResult(
            `Table: ${table.label}`,
            'error',
            `Erro ao acessar: ${error.message}`
          )
        } else {
          addResult(
            `Table: ${table.label}`,
            'success',
            'Tabela acessível'
          )
        }
      } catch (err: any) {
        addResult(
          `Table: ${table.label}`,
          'error',
          `Erro: ${err.message}`
        )
      }
    }
  }

  const testSessionRefresh = async () => {
    try {
      console.log("🧪 Testando refresh de sessão...")
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        addResult('Session Refresh', 'error', `Erro no refresh: ${error.message}`)
      } else {
        addResult('Session Refresh', 'success', 'Sessão renovada com sucesso')
      }
    } catch (err: any) {
      addResult('Session Refresh', 'error', `Erro: ${err.message}`)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()
    
    try {
      testEnvironmentVariables()
      await testSupabaseConnection()
      await testAuthentication()
      await testDatabaseTables()
      await testSessionRefresh()
    } catch (err) {
      console.error("Erro geral nos testes:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (err) {
      console.error("Erro no logout:", err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  useEffect(() => {
    // Executar testes automáticos na inicialização
    runAllTests()
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teste de Ambiente</h1>
                <p className="text-gray-600">Validação completa do sistema</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Testar Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle>Usuário Atual</CardTitle>
                <CardDescription>Informações da sessão ativa</CardDescription>
              </CardHeader>
              <CardContent>
                {userInfo ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Email:</p>
                      <p className="text-sm text-gray-600">{userInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">User ID:</p>
                      <p className="text-xs text-gray-600 font-mono">{userInfo.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Criado em:</p>
                      <p className="text-sm text-gray-600">
                        {new Date(userInfo.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Executar testes para ver informações</p>
                )}
              </CardContent>
            </Card>

            {/* Controles */}
            <Card>
              <CardHeader>
                <CardTitle>Controles de Teste</CardTitle>
                <CardDescription>Execute testes específicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={runAllTests}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    "🚀 Executar Todos os Testes"
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={testEnvironmentVariables}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Env Vars
                  </Button>
                  <Button
                    onClick={testSupabaseConnection}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Conexão
                  </Button>
                  <Button
                    onClick={testAuthentication}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Auth
                  </Button>
                  <Button
                    onClick={testDatabaseTables}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Tabelas
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
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas dos Testes</CardTitle>
                <CardDescription>Resumo dos resultados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de testes:</span>
                    <Badge variant="outline">{results.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sucessos:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {results.filter(r => r.status === 'success').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Erros:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {results.filter(r => r.status === 'error').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avisos:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {results.filter(r => r.status === 'warning').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados dos Testes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resultados dos Testes</CardTitle>
              <CardDescription>
                Detalhes de cada teste executado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum teste executado ainda
                  </p>
                ) : (
                  results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <Badge
                          variant={result.status === 'success' ? 'default' : 'destructive'}
                        >
                          {result.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                      
                      {result.details && (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
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
    </AuthGuard>
  )
} 