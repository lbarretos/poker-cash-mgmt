"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth/auth-guard"
import { usePokerStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function DebugDataPage() {
  const { sessions, players, transactions, loadData } = usePokerStore()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [dbInfo, setDbInfo] = useState<any>(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserInfo(user)
    }
    
    const checkDatabase = async () => {
      try {
        // Teste simples de conexão com a tabela players
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .limit(1)
        
        setDbInfo({
          canAccessPlayers: !error,
          error: error?.message,
          sampleData: data
        })
      } catch (err: any) {
        setDbInfo({
          canAccessPlayers: false,
          error: err.message
        })
      }
    }
    
    loadUserInfo()
    checkDatabase()
    loadData()
  }, [loadData])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Debug de Dados</h1>
              <p className="text-gray-600">Visualizar todos os dados carregados do usuário</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Database Access Info */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Banco de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(dbInfo, null, 2)}
                </pre>
                {dbInfo && !dbInfo.canAccessPlayers && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                    ⚠️ Problema detectado no acesso à tabela 'players': {dbInfo.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Sessões ({sessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(sessions, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle>Jogadores ({players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(players, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transações ({transactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(transactions, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Transaction Mapping Test */}
            <Card>
              <CardHeader>
                <CardTitle>Teste de Mapeamento de Transações</CardTitle>
                <CardDescription>Verificar se as transações podem ser mapeadas para sessões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => {
                  const sessionTransactions = transactions.filter((t) => t.session_id === session.id)
                  return (
                    <div key={session.id} className="border p-4 rounded">
                      <h3 className="font-semibold">{session.name}</h3>
                      <p className="text-sm text-gray-600">ID: {session.id}</p>
                      <p className="text-sm">Transações encontradas: {sessionTransactions.length}</p>
                      {sessionTransactions.length > 0 && (
                        <pre className="bg-gray-50 p-2 mt-2 text-xs overflow-auto max-h-32">
                          {JSON.stringify(sessionTransactions, null, 2)}
                        </pre>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Test Player Creation */}
            <Card>
              <CardHeader>
                <CardTitle>Teste de Criação de Jogador</CardTitle>
                <CardDescription>Teste direto da função addPlayer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={async () => {
                    try {
                      const { addPlayer } = usePokerStore.getState()
                      await addPlayer({
                        name: `Teste ${Date.now()}`,
                        email: `teste${Date.now()}@example.com`,
                        phone: "(11) 99999-9999",
                        notes: "Jogador de teste criado via debug"
                      })
                      console.log("✅ Jogador de teste criado!")
                    } catch (error) {
                      console.error("❌ Erro ao criar jogador de teste:", error)
                    }
                  }}
                >
                  Criar Jogador de Teste
                </Button>
              </CardContent>
            </Card>

            {/* Reload Data */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => loadData()}>
                  Recarregar Dados
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
} 