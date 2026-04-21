"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users, DollarSign, TrendingUp, LogOut,
  BarChart3, Play, CreditCard, Coins, User, ChevronDown
} from "lucide-react"
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

export default function Dashboard() {
  const { sessions, players, transactions, chips, loadData } = usePokerStore()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredTransactions = selectedSessionId
    ? transactions.filter((t) => t.session_id === selectedSessionId)
    : transactions

  const activeSessions = sessions.filter((s) => s.status === "active")
  const totalBuyIns = filteredTransactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
  const totalCashOuts = filteredTransactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
  const currentBalance = totalBuyIns - totalCashOuts

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const fmt = (n: number) => `R$\u00a0${n.toFixed(2).replace(".", ",")}`

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-foreground hidden sm:block">
                Poker Cash
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Session selector */}
              <div className="relative">
                <select
                  className="appearance-none text-sm bg-muted/70 border-0 rounded-lg px-3 py-1.5 pr-7 text-foreground font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                >
                  <option value="">Todas as sessões</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.status === "active" ? " ●" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Apple-style segmented control */}
            <div className="mb-6 sm:mb-8 overflow-x-auto">
              <TabsList className="bg-muted/60 p-1 rounded-xl h-auto inline-flex w-full sm:w-auto min-w-full sm:min-w-0 gap-0.5">
                {[
                  { value: "dashboard", label: "Painel",      icon: BarChart3  },
                  { value: "sessions",  label: "Sessões",     icon: Play       },
                  { value: "players",   label: "Jogadores",   icon: Users      },
                  { value: "transactions", label: "Transações", icon: CreditCard },
                  { value: "chips",     label: "Fichas",      icon: Coins      },
                  { value: "profile",   label: "Perfil",      icon: User       },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden text-[11px]">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Dashboard tab */}
            <TabsContent value="dashboard" className="space-y-5 sm:space-y-6 mt-0">

              {/* KPI grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Sessões Ativas"
                  value={activeSessions.length.toString()}
                  sub={`${sessions.length} total`}
                  icon={Play}
                  accent="text-primary"
                />
                <StatCard
                  label="Buy-ins"
                  value={fmt(totalBuyIns)}
                  sub={`${filteredTransactions.filter(t => t.type === "buy-in").length} entradas`}
                  icon={DollarSign}
                />
                <StatCard
                  label="Cash-outs"
                  value={fmt(totalCashOuts)}
                  sub={`${filteredTransactions.filter(t => t.type === "cash-out").length} saídas`}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Saldo"
                  value={fmt(Math.abs(currentBalance))}
                  sub={currentBalance >= 0 ? "a receber" : "a pagar"}
                  icon={DollarSign}
                  accent={currentBalance >= 0 ? "text-primary" : "text-destructive"}
                  prefix={currentBalance >= 0 ? "+" : "−"}
                />
              </div>

              {/* Recent sessions + top players */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold">Sessões Recentes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {sessions.length === 0 ? (
                      <EmptyState text="Nenhuma sessão ainda" />
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {sessions.slice(0, 5).map((session) => (
                          <li key={session.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{session.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(session.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <StatusBadge active={session.status === "active"} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold">Jogadores</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {players.length === 0 ? (
                      <EmptyState text="Nenhum jogador ainda" />
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {players.slice(0, 5).map((player) => {
                          const pt = transactions.filter(t => t.player_id === player.id)
                          const net = pt.filter(t => t.type === "cash-out").reduce((s, t) => s + t.amount, 0)
                                    - pt.filter(t => t.type === "buy-in").reduce((s, t) => s + t.amount, 0)
                          return (
                            <li key={player.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{player.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{pt.length} transações</p>
                              </div>
                              <span className={`text-sm font-semibold tabular-nums ${net >= 0 ? "text-primary" : "text-destructive"}`}>
                                {net >= 0 ? "+" : ""}R${Math.abs(net).toFixed(2).replace(".", ",")}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="mt-0">
              <SessionManager />
            </TabsContent>

            <TabsContent value="players" className="mt-0">
              <PlayerManager />
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <TransactionManager transactions={filteredTransactions} />
            </TabsContent>

            <TabsContent value="chips" className="mt-0">
              <ChipManager />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <UserProfileManager />
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <PokerTimer />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatCard({
  label, value, sub, icon: Icon, accent = "text-foreground", prefix = ""
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent?: string
  prefix?: string
}) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className={`text-lg sm:text-xl font-bold tabular-nums tracking-tight ${accent}`}>
          {prefix}{value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
      active
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground"
    }`}>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      {active ? "Ativa" : "Concluída"}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-sm text-muted-foreground text-center py-6">{text}</p>
  )
}
