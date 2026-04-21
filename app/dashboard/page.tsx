"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, TrendingUp, Settings, LogOut, BarChart3, Play, CreditCard, Coins, User } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { SessionManager } from "@/components/session-manager"
import { PlayerManager } from "@/components/player-manager"
import { ChipManager } from "@/components/chip-manager"
import { TransactionManager } from "@/components/transaction-manager"
import { UserProfileManager } from "@/components/user-profile-manager"
import { PokerTimer } from "@/components/poker-timer"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth/auth-guard"
import Link from "next/link"

export default function Dashboard() {
  const { sessions, players, transactions, chips, loadData } = usePokerStore()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")

  // Carregar dados quando o componente montar
  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar transações e jogadores pela sessão selecionada
  const filteredTransactions = selectedSessionId
    ? transactions.filter((t) => t.session_id === selectedSessionId)
    : transactions
  const filteredSessions = sessions
  const filteredPlayers = players // Jogadores não são filtrados, mas pode ser útil no futuro
  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  const activeSessions = sessions.filter((s) => s.status === "active")
  const totalBuyIns = filteredTransactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
  const totalCashOuts = filteredTransactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
  const currentBalance = totalBuyIns - totalCashOuts

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header superior responsivo: título em cima, controles embaixo */}
          <div className="mb-6 sm:mb-8 w-full">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 truncate">Gerenciador de Poker Cash</h1>
              <p className="text-xs sm:text-base text-gray-600 truncate mb-2">
                Gerencie suas sessões de poker, jogadores e fluxo de caixa de forma eficiente
              </p>
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-2 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1 whitespace-nowrap">Sessão</label>
                <select
                  className="border rounded px-2 py-1 text-xs sm:text-sm min-w-[90px] max-w-[140px]"
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                >
                  <option value="">Todas</option>
                  {filteredSessions.map((s) => (
                    <option key={s.id} value={s.id} className="truncate">
                      {s.name} {s.status === "active" ? "(Ativa)" : "(Concluída)"}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/debug-data">
                <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">
                  Debug
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 text-xs whitespace-nowrap">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-6 h-auto p-1">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Painel</span>
                <span className="sm:hidden flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Sessões</span>
                <span className="sm:hidden flex items-center justify-center">
                  <Play className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="players" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Jogadores</span>
                <span className="sm:hidden flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Transações</span>
                <span className="sm:hidden flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="chips" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Fichas</span>
                <span className="sm:hidden flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                <span className="hidden sm:inline">Perfil</span>
                <span className="sm:hidden flex items-center justify-center">
                  <User className="h-4 w-4" />
                </span>
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
                      {filteredTransactions.filter((t) => t.type === "buy-in").length} transações
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
                      {filteredTransactions.filter((t) => t.type === "cash-out").length} transações
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
              <TransactionManager transactions={filteredTransactions} />
            </TabsContent>

            <TabsContent value="chips">
              <ChipManager />
            </TabsContent>

            <TabsContent value="profile">
              <UserProfileManager />
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