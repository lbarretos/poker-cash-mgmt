"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowRight, Calculator, CheckCircle, Coins, TrendingDown, TrendingUp, Users } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

/* ------------------------------------------------------------------------- */
/* Types */
/* ------------------------------------------------------------------------- */
interface SettleUpProps {
  sessionId: string
  onClose: () => void
}

interface PlayerBalance {
  playerId: string
  playerName: string
  buyIns: number
  cashOuts: number
  payments: number
  finalChipValue: number
  netPosition: number
  transactionCount: number
}

interface Settlement {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

interface ChipCount {
  playerId: string
  chipValue: number
}

interface Consumption {
  id: string
  payerId: string
  amount: number
  participantIds: string[]
  description?: string
}

/* ------------------------------------------------------------------------- */
/* Component */
/* ------------------------------------------------------------------------- */
export function SettleUp({ sessionId, onClose }: SettleUpProps) {
  /* --------------------------------------------------------------------- */
  /* Store + UI helpers */
  /* --------------------------------------------------------------------- */
  const { sessions, players, transactions, chips } = usePokerStore()
  const { toast } = useToast()

  /* --------------------------------------------------------------------- */
  /* Local state */
  /* --------------------------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<"overview" | "chip-counts" | "consumption" | "settlement">("overview")
  const [chipCounts, setChipCounts] = useState<ChipCount[]>([])
  const [chipCountsEntered, setChipCountsEntered] = useState(false)
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [consumptionForm, setConsumptionForm] = useState({
    payerId: "",
    amount: "",
    participantIds: [] as string[],
    description: ""
  })

  /* --------------------------------------------------------------------- */
  /* Derived data */
  /* --------------------------------------------------------------------- */
  const session = sessions.find((s) => s.id === sessionId)
  const sessionTransactions = transactions.filter((t) => t.session_id === sessionId)

  // Reintroduzir sessionPlayers apenas para chipCounts
  const sessionPlayers = useMemo(() => {
    const ids = new Set(sessionTransactions.map((t) => t.player_id))
    return Array.from(ids).map((id) => ({
      id,
      name: players.find((p) => p.id === id)?.name ?? "Jogador Desconhecido",
    }))
  }, [sessionTransactions, players])

  // Substituir sessionPlayers por allPlayers para consumo
  const allPlayers = players

  /* initialise chip counts on first render */
  useMemo(() => {
    if (chipCounts.length === 0 && sessionPlayers.length) {
      setChipCounts(sessionPlayers.map((p) => ({ playerId: p.id, chipValue: 0 })))
    }
  }, [chipCounts.length, sessionPlayers])

  /* ------------------------------------------------------------ */
  /* Player balances incl. chip value                              */
  /* ------------------------------------------------------------ */
  const playerBalances = useMemo<PlayerBalance[]>(() => {
    const map = new Map<string, PlayerBalance>()

    // Seed balances para todos os jogadores da sessão (com transação) e todos que participaram de consumo
    const involvedPlayerIds = new Set([
      ...sessionTransactions.map((t) => t.player_id),
      ...consumptions.flatMap((c) => [c.payerId, ...c.participantIds]),
    ])
    Array.from(involvedPlayerIds).forEach((id) => {
      if (!map.has(id)) {
        map.set(id, {
          playerId: id,
          playerName: players.find((p) => p.id === id)?.name ?? "Jogador Desconhecido",
          buyIns: 0,
          cashOuts: 0,
          payments: 0,
          finalChipValue: 0,
          netPosition: 0,
          transactionCount: 0,
        })
      }
    })

    // Acumular transações
    sessionTransactions.forEach((t) => {
      const bal = map.get(t.player_id)!
      bal.transactionCount += 1
      if (t.type === "buy-in") bal.buyIns += t.amount
      if (t.type === "cash-out") bal.cashOuts += t.amount
      if (t.type === "payment") bal.payments += t.amount
    })

    // Mesclar chip counts
    chipCounts.forEach((c) => {
      const bal = map.get(c.playerId)
      if (bal) bal.finalChipValue = c.chipValue
    })

    // Consumos: pagador recebe crédito, participantes pagam fração
    consumptions.forEach((cons) => {
      const n = cons.participantIds.length
      if (n === 0) return
      const share = cons.amount / n
      // Pagador recebe crédito do valor total
      const payerBal = map.get(cons.payerId)
      if (payerBal) payerBal.netPosition += cons.amount
      // Cada participante paga sua fração
      cons.participantIds.forEach((pid) => {
        const partBal = map.get(pid)
        if (partBal) partBal.netPosition -= share
      })
    })

    // Calcular netPosition (sem consumo)
    map.forEach((bal) => {
      bal.netPosition += bal.cashOuts + bal.finalChipValue - bal.buyIns + bal.payments
    })

    return Array.from(map.values()).sort((a, b) => b.netPosition - a.netPosition)
  }, [sessionTransactions, players, chipCounts, consumptions])

  /* ------------------------------------------------------------ */
  /* Optimal settlements                                          */
  /* ------------------------------------------------------------ */
  const optimalSettlements = useMemo<Settlement[]>(() => {
    if (!chipCountsEntered) return []

    const creditors = playerBalances.filter((p) => p.netPosition > 0).map((p) => ({ ...p }))
    const debtors = playerBalances.filter((p) => p.netPosition < 0).map((p) => ({ ...p }))
    const results: Settlement[] = []

    let ci = 0,
      di = 0
    while (ci < creditors.length && di < debtors.length) {
      const creditor = creditors[ci]
      const debtor = debtors[di]
      const amt = Math.min(creditor.netPosition, Math.abs(debtor.netPosition))

      if (amt > 0.01) {
        results.push({
          from: debtor.playerId,
          fromName: debtor.playerName,
          to: creditor.playerId,
          toName: creditor.playerName,
          amount: amt,
        })
        creditor.netPosition -= amt
        debtor.netPosition += amt
      }

      if (creditor.netPosition < 0.01) ci++
      if (Math.abs(debtor.netPosition) < 0.01) di++
    }
    return results
  }, [chipCountsEntered, playerBalances])

  /* ------------------------------------------------------------ */
  /* Aggregates                                                   */
  /* ------------------------------------------------------------ */
  const totalBuyIns = sessionTransactions.filter((t) => t.type === "buy-in").reduce((s, t) => s + t.amount, 0)
  const totalCashOuts = sessionTransactions.filter((t) => t.type === "cash-out").reduce((s, t) => s + t.amount, 0)
  const totalPayments = sessionTransactions.filter((t) => t.type === "payment").reduce((s, t) => s + t.amount, 0)
  const totalFinalChipValue = chipCounts.reduce((s, c) => s + c.chipValue, 0)

  const expectedBalance = totalBuyIns + totalPayments
  const actualBalance = totalCashOuts + totalFinalChipValue
  const netDifference = actualBalance - expectedBalance
  const isBalanced = Math.abs(netDifference) < 0.01

  /* --------------------------------------------------------------------- */
  /* Handlers                                                              */
  /* --------------------------------------------------------------------- */
  const updateChipCount = (id: string, value: string) => {
    const num = Number.parseFloat(value.replace(",", ".")) || 0
    setChipCounts((prev) => prev.map((c) => (c.playerId === id ? { ...c, chipValue: num } : c)))
  }

  // Alterar calculateSettlement para ir para a aba de consumo
  const calculateSettlement = () => {
    if (chipCounts.some((c) => c.chipValue < 0)) {
      toast({
        title: "Valores de ficha inválidos",
        description: "Os valores das fichas não podem ser negativos.",
        variant: "destructive",
      })
      return
    }
    // Validar se a soma das fichas finais bate com as iniciais
    const totalFinalChipValue = chipCounts.reduce((s, c) => s + c.chipValue, 0)
    const totalBuyIns = sessionTransactions.filter((t) => t.type === "buy-in").reduce((s, t) => s + t.amount, 0)
    const totalPayments = sessionTransactions.filter((t) => t.type === "payment").reduce((s, t) => s + t.amount, 0)
    const expected = totalBuyIns + totalPayments
    if (Math.abs(totalFinalChipValue - expected) > 0.01) {
      toast({
        title: "Fichas não batem",
        description: `A soma das fichas finais (R$${totalFinalChipValue.toFixed(2).replace('.', ',')}) não é igual ao total de fichas iniciais (R$${expected.toFixed(2).replace('.', ',')}). Corrija antes de prosseguir.`,
        variant: "destructive",
      })
      return
    }
    setChipCountsEntered(true)
    setActiveTab("consumption")
    toast({
      title: "Contagens de fichas processadas",
      description: "Agora registre os consumos antes do acerto final.",
    })
  }

  const copySettlement = () => {
    const text = optimalSettlements
      .map((s) => `${s.fromName} paga ${s.toName}: R$${s.amount.toFixed(2).replace(".", ",")}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    toast({ title: "Acerto copiado", description: "Detalhes copiados para a área de transferência." })
  }

  const resetChipCounts = () => {
    setChipCounts(sessionPlayers.map((p) => ({ playerId: p.id, chipValue: 0 })))
    setChipCountsEntered(false)
    setActiveTab("chip-counts")
  }

  // Helper para resetar formulário de consumo
  const resetConsumptionForm = () => setConsumptionForm({ payerId: "", amount: "", participantIds: [], description: "" })

  // Adicionar consumo
  const addConsumption = () => {
    const amount = Number.parseFloat(consumptionForm.amount.replace(",", "."))
    if (!consumptionForm.payerId || !amount || consumptionForm.participantIds.length === 0) {
      toast({ title: "Preencha todos os campos do consumo", variant: "destructive" })
      return
    }
    setConsumptions(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        payerId: consumptionForm.payerId,
        amount,
        participantIds: consumptionForm.participantIds,
        description: consumptionForm.description
      }
    ])
    resetConsumptionForm()
  }

  // Remover consumo
  const removeConsumption = (id: string) => setConsumptions(prev => prev.filter(c => c.id !== id))

  // Só libera "Acerto" se fichas e consumos processados
  const canGoToSettlement = chipCountsEntered

  /* --------------------------------------------------------------------- */
  /* Guard                                                                  */
  /* --------------------------------------------------------------------- */
  if (!session) return null

  /* --------------------------------------------------------------------- */
  /* UI                                                                     */
  /* --------------------------------------------------------------------- */
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] overflow-y-auto">
        {/* ----------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ----------------------------------------------------------------- */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="size-4 sm:size-5" />
            <span className="truncate">Acertar Contas – {session.name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Insira as contagens finais de fichas e calcule os acertos entre jogadores
          </DialogDescription>
        </DialogHeader>

        {/* ----------------------------------------------------------------- */}
        {/* Tabs                                                              */}
        {/* ----------------------------------------------------------------- */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-4 gap-px bg-muted rounded-lg">
            <TabsTrigger value="overview" className="py-2 text-xs sm:text-sm">
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="chip-counts" className="py-2 text-xs sm:text-sm">
              <span className="hidden sm:inline">Fichas</span>
              <span className="sm:hidden">🪙</span>
            </TabsTrigger>
            <TabsTrigger value="consumption" className="py-2 text-xs sm:text-sm">
              <span className="hidden sm:inline">Consumo</span>
              <span className="sm:hidden">🍻</span>
            </TabsTrigger>
            <TabsTrigger
              value="settlement"
              disabled={!canGoToSettlement}
              className="py-2 text-xs sm:text-sm disabled:opacity-50"
            >
              <span className="hidden sm:inline">Acerto</span>
              <span className="sm:hidden">💰</span>
            </TabsTrigger>
          </TabsList>

          {/* --------------------------------------------------------------- */}
          {/* Overview                                                        */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Players */}
              <SummaryCard
                title="Jogadores"
                icon={<Users className="size-3 sm:size-4" />}
                value={sessionPlayers.length}
              />
              {/* Buy-ins */}
              <SummaryCard
                title="Buy-ins"
                icon={<TrendingDown className="size-3 sm:size-4 text-red-500" />}
                value={`R$${totalBuyIns.toFixed(2).replace(".", ",")}`}
                valueClass="text-red-600"
              />
              {/* Cash-outs */}
              <SummaryCard
                title="Cash-outs"
                icon={<TrendingUp className="size-3 sm:size-4 text-green-500" />}
                value={`R$${totalCashOuts.toFixed(2).replace(".", ",")}`}
                valueClass="text-green-600"
              />
              {/* Chips */}
              <SummaryCard
                title="Fichas"
                icon={<Coins className="size-3 sm:size-4 text-blue-500" />}
                value={`R$${totalFinalChipValue.toFixed(2).replace(".", ",")}`}
                valueClass="text-blue-600"
                footer={chipCountsEntered ? "Inserido" : "Não inserido"}
              />
            </div>

            {/* Transaction summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Resumo das Transações</CardTitle>
                <CardDescription className="text-sm">Visão geral de todas as transações</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mobile – cards */}
                <div className="sm:hidden space-y-3">
                  {playerBalances.map((p) => (
                    <TransactionCard key={p.playerId} balance={p} />
                  ))}
                </div>
                {/* Desktop – table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jogador</TableHead>
                        <TableHead className="text-right">Buy-ins</TableHead>
                        <TableHead className="text-right">Cash-outs</TableHead>
                        <TableHead className="text-right">Pagamentos</TableHead>
                        <TableHead className="text-right">Transações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerBalances.map((b) => (
                        <TableRow key={b.playerId}>
                          <TableCell className="font-medium">{b.playerName}</TableCell>
                          <TableCell className="text-right text-red-600">
                            R${b.buyIns.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            R${b.cashOuts.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            R${b.payments.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right">{b.transactionCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={() => setActiveTab("chip-counts")} size="lg" className="w-full sm:w-auto">
                <Coins className="size-4 mr-2" />
                Inserir Contagens Finais de Fichas
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* Chip counts                                                     */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="chip-counts" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Inserir Contagens Finais de Fichas</CardTitle>
                <CardDescription className="text-sm">Informe o valor total das fichas de cada jogador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionPlayers.map((p) => {
                  const value = chipCounts.find((c) => c.playerId === p.id)?.chipValue ?? 0
                  return (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <Label className="font-medium sm:w-32">{p.name}</Label>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="w-full sm:w-32"
                          placeholder="0,00"
                          value={value.toFixed(2).replace(".", ",")}
                          onChange={(e) => updateChipCount(p.id, e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })}

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Final de Fichas</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      R${totalFinalChipValue.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={resetChipCounts} className="w-full sm:w-auto bg-transparent">
                      Redefinir
                    </Button>
                    <Button onClick={calculateSettlement} className="w-full sm:w-auto">
                      Calcular Acerto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {chips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Calculadora de Valor de Fichas</CardTitle>
                  <CardDescription className="text-sm">
                    Use seus tipos de fichas configurados para calcular valores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {chips.map((c) => (
                      <div key={c.id} className="border rounded-lg p-3 text-center">
                        <p className="text-xs sm:text-sm font-medium">{c.color}</p>
                        <p className="text-sm sm:text-lg font-bold">R${c.value.toFixed(2).replace(".", ",")}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Consumo */}
          <TabsContent value="consumption" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Adicionar Consumo</CardTitle>
                <CardDescription className="text-sm">Registre gastos de consumo para rateio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Pagador */}
                  <div className="flex-1">
                    <Label>Quem pagou?</Label>
                    <select
                      className="w-full border rounded p-2 mt-1"
                      value={consumptionForm.payerId}
                      onChange={e => setConsumptionForm(f => ({ ...f, payerId: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {allPlayers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Valor */}
                  <div className="flex-1">
                    <Label>Valor total</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="w-full mt-1"
                      placeholder="0,00"
                      value={consumptionForm.amount}
                      onChange={e => setConsumptionForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                </div>
                {/* Participantes */}
                <div>
                  <Label>Quem participou?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allPlayers.map(p => (
                      <label key={p.id} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={consumptionForm.participantIds.includes(p.id)}
                          onChange={e => {
                            setConsumptionForm(f => ({
                              ...f,
                              participantIds: e.target.checked
                                ? [...f.participantIds, p.id]
                                : f.participantIds.filter(id => id !== p.id)
                            }))
                          }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Descrição opcional */}
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Input
                    type="text"
                    className="w-full mt-1"
                    placeholder="Ex: Cerveja, Pizza..."
                    value={consumptionForm.description}
                    onChange={e => setConsumptionForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetConsumptionForm}>Limpar</Button>
                  <Button onClick={addConsumption}>Adicionar Consumo</Button>
                </div>
              </CardContent>
            </Card>
            {/* Lista de consumos adicionados */}
            {consumptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Consumos Adicionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {consumptions.map(cons => (
                    <div key={cons.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded p-2 gap-2">
                      <div>
                        <span className="font-medium">{players.find(p => p.id === cons.payerId)?.name || "?"}</span> pagou <span className="font-bold text-blue-600">R${cons.amount.toFixed(2).replace(".", ",")}</span>
                        {cons.description && <span className="ml-2 text-xs text-muted-foreground">({cons.description})</span>}
                        <br />
                        <span className="text-xs">Participantes: {cons.participantIds.map(pid => allPlayers.find(p => p.id === pid)?.name).join(", ")}</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeConsumption(cons.id)}>Remover</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <div className="text-center">
              <Button onClick={() => setActiveTab("settlement")}
                size="lg"
                className="w-full sm:w-auto"
                disabled={!canGoToSettlement}
              >
                <CheckCircle className="size-4 mr-2" />
                Ir para Acerto Final
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* Settlement                                                      */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="settlement" className="space-y-4 sm:space-y-6">
            {/* Balance check */}
            <Card className={isBalanced ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 text-base sm:text-lg ${
                    isBalanced ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  {isBalanced ? (
                    <CheckCircle className="size-4 sm:size-5" />
                  ) : (
                    <AlertCircle className="size-4 sm:size-5" />
                  )}
                  Verificação de Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Esperado:</p>
                    <p className="text-base sm:text-lg">R${expectedBalance.toFixed(2).replace(".", ",")}</p>
                    <p className="text-xs text-muted-foreground">Buy-ins + Pagamentos</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Real:</p>
                    <p className="text-base sm:text-lg">R${actualBalance.toFixed(2).replace(".", ",")}</p>
                    <p className="text-xs text-muted-foreground">Cash-outs + Fichas</p>
                  </div>
                </div>

                {!isBalanced && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-xs sm:text-sm">
                    Diferença de {netDifference > 0 ? "excesso" : "falta"}:&nbsp;
                    <span className="font-medium">R${Math.abs(netDifference).toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player positions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Posições Finais dos Jogadores</CardTitle>
                <CardDescription className="text-sm">Posição líquida incluindo fichas finais</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mobile */}
                <div className="sm:hidden space-y-3">
                  {playerBalances.map((b) => (
                    <PlayerPositionCard key={b.playerId} balance={b} />
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jogador</TableHead>
                        <TableHead className="text-right">Buy-ins</TableHead>
                        <TableHead className="text-right">Cash-outs</TableHead>
                        <TableHead className="text-right">Fichas</TableHead>
                        <TableHead className="text-right">Posição</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerBalances.map((b) => (
                        <TableRow key={b.playerId}>
                          <TableCell className="font-medium">{b.playerName}</TableCell>
                          <TableCell className="text-right text-red-600">
                            R${b.buyIns.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            R${b.cashOuts.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            R${b.finalChipValue.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              b.netPosition > 0
                                ? "text-green-600"
                                : b.netPosition < 0
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {b.netPosition >= 0 ? "+" : ""}
                            R${b.netPosition.toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={b.netPosition > 0 ? "default" : b.netPosition < 0 ? "destructive" : "secondary"}
                            >
                              {b.netPosition > 0 ? "Recebe" : b.netPosition < 0 ? "Paga" : "Equilibrado"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Settlement list */}
            {optimalSettlements.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Acerto de Contas Entre Jogadores</CardTitle>
                      <CardDescription className="text-sm">Transações ótimas para equilibrar todos</CardDescription>
                    </div>
                    <Button variant="outline" onClick={copySettlement}>
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {optimalSettlements.map((s, i) => (
                    <div key={i} className="p-3 sm:p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SettlementParty name={s.fromName} type="from" />
                        <ArrowRight className="size-4 text-muted-foreground" />
                        <SettlementParty name={s.toName} type="to" />
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-green-600">
                        R${s.amount.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    {optimalSettlements.length} transaç
                    {optimalSettlements.length === 1 ? "ão" : "ões"} &nbsp;•&nbsp; Valor total:&nbsp; R$
                    {optimalSettlements
                      .reduce((s, o) => s + o.amount, 0)
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center space-y-2">
                  <CheckCircle className="size-8 sm:size-10 text-green-500 mx-auto" />
                  <p className="text-sm sm:text-base font-medium">Todos Equilibrados!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Nenhum acerto necessário após considerar as fichas finais.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ----------------------------------------------------------------- */}
        {/* Footer actions                                                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex justify-between pt-4 gap-2">
          <Button
            variant="outline"
            onClick={resetChipCounts}
            disabled={!chipCountsEntered}
            className="w-full sm:w-auto bg-transparent"
          >
            Redefinir Contagens
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------------- */
/* Helper components                                                         */
/* ------------------------------------------------------------------------- */

function SummaryCard({
  title,
  icon,
  value,
  valueClass = "",
  footer,
}: {
  title: string
  icon: React.ReactNode
  value: React.ReactNode
  valueClass?: string
  footer?: string
}) {
  return (
    <Card className="min-h-[90px] sm:min-h-[110px] flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1 text-xs sm:text-sm font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-lg sm:text-2xl font-bold ${valueClass}`}>{value}</p>
        {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
      </CardContent>
    </Card>
  )
}

function TransactionCard({ balance }: { balance: PlayerBalance }) {
  return (
    <div className="border rounded-lg p-3 text-xs space-y-1">
      <p className="font-medium text-sm mb-1">{balance.playerName}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          Buy-ins:{" "}
          <span className="text-red-600">
            R$
            {balance.buyIns.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div>
          Cash-outs:{" "}
          <span className="text-green-600">
            R$
            {balance.cashOuts.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div>
          Pagamentos:{" "}
          <span className="text-blue-600">
            R$
            {balance.payments.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div>Transações: {balance.transactionCount}</div>
      </div>
    </div>
  )
}

function PlayerPositionCard({ balance }: { balance: PlayerBalance }) {
  return (
    <div className="border rounded-lg p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-medium">{balance.playerName}</p>
        <Badge
          variant={balance.netPosition > 0 ? "default" : balance.netPosition < 0 ? "destructive" : "secondary"}
          className="text-[10px]"
        >
          {balance.netPosition > 0 ? "Recebe" : balance.netPosition < 0 ? "Paga" : "Equilibrado"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div>Buy-ins: R${balance.buyIns.toFixed(2).replace(".", ",")}</div>
        <div>Cash-outs: R${balance.cashOuts.toFixed(2).replace(".", ",")}</div>
        <div>Fichas: R${balance.finalChipValue.toFixed(2).replace(".", ",")}</div>
        <div
          className={`font-bold ${
            balance.netPosition > 0 ? "text-green-600" : balance.netPosition < 0 ? "text-red-600" : ""
          }`}
        >
          {balance.netPosition >= 0 ? "+" : ""}
          R${balance.netPosition.toFixed(2).replace(".", ",")}
        </div>
      </div>
    </div>
  )
}

function SettlementParty({ name, type }: { name: string; type: "from" | "to" }) {
  return (
    <div className="text-center">
      <p className="text-xs sm:text-sm font-medium truncate max-w-[80px]">{name}</p>
      <Badge variant={type === "from" ? "destructive" : "default"} className="text-[10px] sm:text-xs">
        {type === "from" ? "Paga" : "Recebe"}
      </Badge>
    </div>
  )
}
