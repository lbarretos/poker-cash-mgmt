"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePokerStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"

export default function TestEnv() {
  const { sessions, players, transactions, chips, addSession, addPlayer, addTransaction, loadData } = usePokerStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      loadData()
    }
  }

  const testAddSession = async () => {
    setLoading(true)
    try {
      await addSession({
        name: "Sessão de Teste",
        status: "active",
        tableCount: 1,
        notes: "Sessão criada para teste"
      })
      alert("Sessão criada com sucesso!")
    } catch (error) {
      alert("Erro ao criar sessão: " + error)
    }
    setLoading(false)
  }

  const testAddPlayer = async () => {
    setLoading(true)
    try {
      await addPlayer({
        name: "Jogador Teste",
        email: "jogador@teste.com",
        phone: "11999999999",
        notes: "Jogador criado para teste"
      })
      alert("Jogador criado com sucesso!")
    } catch (error) {
      alert("Erro ao criar jogador: " + error)
    }
    setLoading(false)
  }

  const testAddTransaction = async () => {
    if (sessions.length === 0 || players.length === 0) {
      alert("Crie uma sessão e um jogador primeiro!")
      return
    }

    setLoading(true)
    try {
      await addTransaction({
        sessionId: sessions[0].id,
        playerId: players[0].id,
        type: "buy-in",
        amount: 100,
        notes: "Transação de teste"
      })
      alert("Transação criada com sucesso!")
    } catch (error) {
      alert("Erro ao criar transação: " + error)
    }
    setLoading(false)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Configuração e Banco de Dados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Status das variáveis de ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}</p>
            <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida'}</p>
            <p>Usuário logado: {user ? '✅ Sim' : '❌ Não'}</p>
            {user && (
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Dados no Store */}
        <Card>
          <CardHeader>
            <CardTitle>Dados no Store</CardTitle>
            <CardDescription>Quantidade de dados carregados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Sessões: {sessions.length}</p>
            <p>Jogadores: {players.length}</p>
            <p>Transações: {transactions.length}</p>
            <p>Tipos de Fichas: {chips.length}</p>
          </CardContent>
        </Card>

        {/* Testes */}
        <Card>
          <CardHeader>
            <CardTitle>Testes de Criação</CardTitle>
            <CardDescription>Teste criar dados no Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testAddSession} 
              disabled={loading || !user}
              className="w-full"
            >
              Criar Sessão de Teste
            </Button>
            <Button 
              onClick={testAddPlayer} 
              disabled={loading || !user}
              className="w-full"
            >
              Criar Jogador de Teste
            </Button>
            <Button 
              onClick={testAddTransaction} 
              disabled={loading || !user || sessions.length === 0 || players.length === 0}
              className="w-full"
            >
              Criar Transação de Teste
            </Button>
          </CardContent>
        </Card>

        {/* Dados Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Recentes</CardTitle>
            <CardDescription>Últimos dados criados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium">Últimas Sessões:</h4>
              {sessions.slice(0, 3).map((session) => (
                <p key={session.id} className="text-sm text-gray-600">
                  {session.name} - {session.status}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-medium">Últimos Jogadores:</h4>
              {players.slice(0, 3).map((player) => (
                <p key={player.id} className="text-sm text-gray-600">
                  {player.name}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-medium">Últimas Transações:</h4>
              {transactions.slice(0, 3).map((transaction) => (
                <p key={transaction.id} className="text-sm text-gray-600">
                  {transaction.type} - R${transaction.amount}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Como verificar no Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Vá para o painel do Supabase</li>
              <li>Clique em <strong>Table Editor</strong></li>
              <li>Verifique as tabelas: <code>sessions</code>, <code>players</code>, <code>transactions</code>, <code>chip_types</code></li>
              <li>Os dados devem aparecer com o <code>user_id</code> do usuário logado</li>
              <li>Se não aparecer, verifique se as políticas RLS estão configuradas corretamente</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 