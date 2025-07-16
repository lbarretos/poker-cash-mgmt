"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, TrendingUp, Settings, LogOut } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { SessionManager } from "@/components/session-manager"
import { PlayerManager } from "@/components/player-manager"
import { ChipManager } from "@/components/chip-manager"
import { TransactionManager } from "@/components/transaction-manager"
import { PokerTimer } from "@/components/poker-timer"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function Dashboard() {
  const { sessions, players, transactions, chips, loadData } = usePokerStore()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Carregar dados quando o componente montar
  useEffect(() => {
    loadData()
  }, [loadData])

  const activeSessions = sessions.filter((s) => s.status === "active")
  const totalBuyIns = transactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
  const totalCashOuts = transactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
  const currentBalance = totalBuyIns - totalCashOuts

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Gerenciador de Poker Cash</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gerencie suas sessões de poker, jogadores e fluxo de caixa de forma eficiente
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Painel</span>
                <span className="sm:hidden"></span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Sessões</span>
                <span className="sm:hidden"></span>
              </TabsTrigger>
              <TabsTrigger value="players" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Jogadores</span>
                <span className="sm:hidden"></span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Transações</span>
                <span className="sm:hidden"></span>
              </TabsTrigger>
              <TabsTrigger value="chips" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Fichas</span>
                <span className="sm:hidden"></span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card className="min-h-[100px] sm:min-h-[120px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Sessões Ativas</CardTitle>
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{activeSessions.length}</div>
                    <p className="text-xs text-muted-foreground">{sessions.length} sessões totais</p>
                  </CardContent>
                </Card>

                <Card className="min-h-[100px] sm:min-h-[120px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total de Buy-ins</CardTitle>
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">R${totalBuyIns.toFixed(2).replace(".", ",")}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "buy-in").length} transações
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-h-[100px] sm:min-h-[120px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total de Cash-outs</CardTitle>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">R${totalCashOuts.toFixed(2).replace(".", ",")}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "cash-out").length} transações
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-h-[100px] sm:min-h-[120px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Saldo Atual</CardTitle>
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-lg sm:text-2xl font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      R${currentBalance.toFixed(2).replace(".", ",")}
                    </div>
                    <p className="text-xs text-muted-foreground">Fluxo de caixa líquido</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Sessões Recentes</CardTitle>
                    <CardDescription className="text-sm">Suas últimas sessões de poker</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {sessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{session.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge variant={session.status === "active" ? "default" : "secondary"} className="ml-2 text-xs">
                            {session.status === "active" ? "Ativa" : "Concluída"}
                          </Badge>
                        </div>
                      ))}
                      {sessions.length === 0 && (
                        <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma sessão ainda</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Melhores Jogadores</CardTitle>
                    <CardDescription className="text-sm">Jogadores mais ativos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {players.slice(0, 5).map((player) => {
                        const playerTransactions = transactions.filter((t) => t.player_id === player.id)
                        const buyIns = playerTransactions
                          .filter((t) => t.type === "buy-in")
                          .reduce((sum, t) => sum + t.amount, 0)
                        const cashOuts = playerTransactions
                          .filter((t) => t.type === "cash-out")
                          .reduce((sum, t) => sum + t.amount, 0)
                        const netAmount = cashOuts - buyIns

                        return (
                          <div key={player.id} className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{player.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {playerTransactions.length} transações
                              </p>
                            </div>
                            <div
                              className={`text-xs sm:text-sm font-medium ml-2 ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {netAmount >= 0 ? "+" : ""}R${netAmount.toFixed(2).replace(".", ",")}
                            </div>
                          </div>
                        )
                      })}
                      {players.length === 0 && (
                        <p className="text-muted-foreground text-center py-4 text-sm">Nenhum jogador ainda</p>
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

          {/* Cronômetro do Jogo */}
          <div className="mt-6">
            <PokerTimer />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
} 