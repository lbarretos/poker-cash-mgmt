"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePokerStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function TestDataPage() {
  const { addSession, addPlayer, addTransaction, loadData } = usePokerStore()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ success: boolean; message: string }[]>([])
  const [user, setUser] = useState<any>(null)

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    return user
  }

  const createTestData = async () => {
    setLoading(true)
    setResults([])
    
    try {
      // Verificar se usuário está logado
      const currentUser = await checkUser()
      if (!currentUser) {
        setResults([{ success: false, message: "Usuário não está logado" }])
        return
      }

      const newResults: { success: boolean; message: string }[] = []

      // 1. Criar sessão
      try {
        await addSession({
          name: "Sessão de Poker - Sexta à Noite",
          status: "active",
          tableCount: 2,
          notes: "Sessão semanal com amigos"
        })
        newResults.push({ success: true, message: "✅ Sessão criada com sucesso" })
      } catch (error) {
        newResults.push({ success: false, message: `❌ Erro ao criar sessão: ${error}` })
      }

      // 2. Criar jogadores
      const players = [
        { name: "João Silva", email: "joao@email.com", phone: "11999999999", notes: "Jogador regular" },
        { name: "Maria Santos", email: "maria@email.com", phone: "11888888888", notes: "Jogadora iniciante" },
        { name: "Pedro Costa", email: "pedro@email.com", phone: "11777777777", notes: "Jogador experiente" },
        { name: "Ana Oliveira", email: "ana@email.com", phone: "11666666666", notes: "Jogadora profissional" }
      ]

      const createdPlayers: any[] = []
      for (const player of players) {
        try {
          await addPlayer(player)
          createdPlayers.push(player)
          newResults.push({ success: true, message: `✅ Jogador ${player.name} criado` })
        } catch (error) {
          newResults.push({ success: false, message: `❌ Erro ao criar jogador ${player.name}: ${error}` })
        }
      }

      // 3. Aguardar um pouco para garantir que os dados foram salvos
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 4. Recarregar dados para pegar os IDs
      await loadData()

      // 5. Buscar sessões e jogadores criados
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(4)

      if (sessions && sessions.length > 0 && playersData && playersData.length > 0) {
        const sessionId = sessions[0].id

        // 6. Criar transações
        const transactions = [
          { playerId: playersData[0].id, type: "buy-in" as const, amount: 200, notes: "Buy-in inicial" },
          { playerId: playersData[1].id, type: "buy-in" as const, amount: 150, notes: "Buy-in inicial" },
          { playerId: playersData[2].id, type: "buy-in" as const, amount: 300, notes: "Buy-in inicial" },
          { playerId: playersData[3].id, type: "buy-in" as const, amount: 250, notes: "Buy-in inicial" },
          { playerId: playersData[0].id, type: "cash-out" as const, amount: 350, notes: "Cash-out com lucro" },
          { playerId: playersData[1].id, type: "cash-out" as const, amount: 80, notes: "Cash-out com prejuízo" },
          { playerId: playersData[2].id, type: "cash-out" as const, amount: 450, notes: "Cash-out com lucro" },
          { playerId: playersData[3].id, type: "cash-out" as const, amount: 200, notes: "Cash-out no zero a zero" }
        ]

        for (const transaction of transactions) {
          try {
            await addTransaction({
              sessionId,
              ...transaction
            })
            newResults.push({ 
              success: true, 
              message: `✅ Transação ${transaction.type} R$${transaction.amount} criada` 
            })
          } catch (error) {
            newResults.push({ 
              success: false, 
              message: `❌ Erro ao criar transação: ${error}` 
            })
          }
        }
      } else {
        newResults.push({ success: false, message: "❌ Não foi possível encontrar sessão ou jogadores para criar transações" })
      }

      // 7. Recarregar dados finais
      await loadData()

      setResults(newResults)

    } catch (error) {
      setResults([{ success: false, message: `❌ Erro geral: ${error}` }])
    } finally {
      setLoading(false)
    }
  }

  const clearTestData = async () => {
    setLoading(true)
    try {
      const currentUser = await checkUser()
      if (!currentUser) {
        setResults([{ success: false, message: "Usuário não está logado" }])
        return
      }

      // Deletar dados de teste (opcional - apenas para limpeza)
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', currentUser.id)
        .like('name', '%Teste%')

      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('user_id', currentUser.id)
        .like('name', '%Teste%')

      if (!sessionsError && !playersError) {
        setResults([{ success: true, message: "✅ Dados de teste removidos" }])
        await loadData()
      } else {
        setResults([{ success: false, message: "❌ Erro ao remover dados de teste" }])
      }
    } catch (error) {
      setResults([{ success: false, message: `❌ Erro: ${error}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Envio de Dados para Supabase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status do Usuário</CardTitle>
            <CardDescription>Verificação de autenticação</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Logado: {user ? '✅ Sim' : '❌ Não'}</p>
            {user && (
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações de Teste</CardTitle>
            <CardDescription>Criar dados fictícios no Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={createTestData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando dados...
                </>
              ) : (
                "🚀 Criar Dados de Teste"
              )}
            </Button>
            
            <Button 
              onClick={clearTestData} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              🗑️ Limpar Dados de Teste
            </Button>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Teste</CardTitle>
            <CardDescription>Status de cada operação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados que serão criados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">📋 Sessão:</h4>
                <ul className="text-sm text-gray-600 ml-4">
                  <li>Nome: "Sessão de Poker - Sexta à Noite"</li>
                  <li>Status: Ativa</li>
                  <li>Mesas: 2</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">👥 Jogadores:</h4>
                <ul className="text-sm text-gray-600 ml-4">
                  <li>João Silva (regular)</li>
                  <li>Maria Santos (iniciante)</li>
                  <li>Pedro Costa (experiente)</li>
                  <li>Ana Oliveira (profissional)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">💰 Transações:</h4>
                <ul className="text-sm text-gray-600 ml-4">
                  <li>4 Buy-ins (R$ 200, R$ 150, R$ 300, R$ 250)</li>
                  <li>4 Cash-outs (R$ 350, R$ 80, R$ 450, R$ 200)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 