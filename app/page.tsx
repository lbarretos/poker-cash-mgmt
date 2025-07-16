"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, TrendingUp, Settings } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { SessionManager } from "@/components/session-manager"
import { PlayerManager } from "@/components/player-manager"
import { ChipManager } from "@/components/chip-manager"
import { TransactionManager } from "@/components/transaction-manager"

export default function Dashboard() {
  const { sessions, players, transactions, chips } = usePokerStore()
  const [activeTab, setActiveTab] = useState("dashboard")

  const activeSessions = sessions.filter((s) => s.status === "active")
  const totalBuyIns = transactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
  const totalCashOuts = transactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
  const currentBalance = totalBuyIns - totalCashOuts

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gerenciador de Poker Cash</h1>
          <p className="text-gray-600">Gerencie suas sessões de poker, jogadores e fluxo de caixa de forma eficiente</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Painel</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="players">Jogadores</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="chips">Fichas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeSessions.length}</div>
                  <p className="text-xs text-muted-foreground">{sessions.length} sessões totais</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Buy-ins</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R${totalBuyIns.toFixed(2).replace(".", ",")}</div>
                  <p className="text-xs text-muted-foreground">
                    {transactions.filter((t) => t.type === "buy-in").length} transações
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Cash-outs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R${totalCashOuts.toFixed(2).replace(".", ",")}</div>
                  <p className="text-xs text-muted-foreground">
                    {transactions.filter((t) => t.type === "cash-out").length} transações
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    R${currentBalance.toFixed(2).replace(".", ",")}
                  </div>
                  <p className="text-xs text-muted-foreground">Fluxo de caixa líquido</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sessões Recentes</CardTitle>
                  <CardDescription>Suas últimas sessões de poker</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status === "active" ? "Ativa" : "Concluída"}
                        </Badge>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Nenhuma sessão ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Melhores Jogadores</CardTitle>
                  <CardDescription>Jogadores mais ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {players.slice(0, 5).map((player) => {
                      const playerTransactions = transactions.filter((t) => t.playerId === player.id)
                      const buyIns = playerTransactions
                        .filter((t) => t.type === "buy-in")
                        .reduce((sum, t) => sum + t.amount, 0)
                      const cashOuts = playerTransactions
                        .filter((t) => t.type === "cash-out")
                        .reduce((sum, t) => sum + t.amount, 0)
                      const netAmount = cashOuts - buyIns

                      return (
                        <div key={player.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">{playerTransactions.length} transações</p>
                          </div>
                          <div className={`text-sm font-medium ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {netAmount >= 0 ? "+" : ""}R${netAmount.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                      )
                    })}
                    {players.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Nenhum jogador ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <SessionManager />
          </TabsContent>

          <TabsContent value="players">
            <PlayerManager />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManager />
          </TabsContent>

          <TabsContent value="chips">
            <ChipManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
