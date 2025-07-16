"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, TrendingUp, TrendingDown, Users, Calculator, CheckCircle, AlertCircle, Coins } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

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

export function SettleUp({ sessionId, onClose }: SettleUpProps) {
  const { sessions, players, transactions, chips } = usePokerStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [chipCounts, setChipCounts] = useState<ChipCount[]>([])
  const [chipCountsEntered, setChipCountsEntered] = useState(false)

  const session = sessions.find((s) => s.id === sessionId)
  const sessionTransactions = transactions.filter((t) => t.sessionId === sessionId)

  // Get all players who participated in this session
  const sessionPlayers = useMemo(() => {
    const playerIds = new Set(sessionTransactions.map((t) => t.playerId))
    return Array.from(playerIds).map((id) => {
      const player = players.find((p) => p.id === id)
      return {
        id,
        name: player?.name || "Jogador Desconhecido",
      }
    })
  }, [sessionTransactions, players])

  // Initialize chip counts when component mounts
  useMemo(() => {
    if (chipCounts.length === 0 && sessionPlayers.length > 0) {
      setChipCounts(
        sessionPlayers.map((player) => ({
          playerId: player.id,
          chipValue: 0,
        })),
      )
    }
  }, [sessionPlayers, chipCounts.length])

  // Calculate player balances including final chip values
  const playerBalances = useMemo(() => {
    const balanceMap = new Map<string, PlayerBalance>()

    // Initialize all players who participated in this session
    sessionTransactions.forEach((transaction) => {
      const player = players.find((p) => p.id === transaction.playerId)
      if (!balanceMap.has(transaction.playerId)) {
        balanceMap.set(transaction.playerId, {
          playerId: transaction.playerId,
          playerName: player?.name || "Jogador Desconhecido",
          buyIns: 0,
          cashOuts: 0,
          payments: 0,
          finalChipValue: 0,
          netPosition: 0,
          transactionCount: 0,
        })
      }
    })

    // Calculate totals for each player
    sessionTransactions.forEach((transaction) => {
      const balance = balanceMap.get(transaction.playerId)!
      balance.transactionCount++

      switch (transaction.type) {
        case "buy-in":
          balance.buyIns += transaction.amount
          break
        case "cash-out":
          balance.cashOuts += transaction.amount
          break
        case "payment":
          balance.payments += transaction.amount
          break
      }
    })

    // Add final chip values
    chipCounts.forEach((chipCount) => {
      const balance = balanceMap.get(chipCount.playerId)
      if (balance) {
        balance.finalChipValue = chipCount.chipValue
      }
    })

    // Calculate net positions (positive = owed money, negative = owes money)
    // Net position = (cash-outs + final chip value) - buy-ins + payments
    // Positive = player should receive money, Negative = player owes money
    balanceMap.forEach((balance) => {
      balance.netPosition = balance.cashOuts + balance.finalChipValue - balance.buyIns + balance.payments
    })

    return Array.from(balanceMap.values()).sort((a, b) => b.netPosition - a.netPosition)
  }, [sessionTransactions, players, chipCounts])

  // Calculate optimal settlements using chip-based settlement
  const optimalSettlements = useMemo(() => {
    if (!chipCountsEntered) return []

    const settlements: Settlement[] = []
    const creditors = playerBalances.filter((p) => p.netPosition > 0).map((p) => ({ ...p }))
    const debtors = playerBalances.filter((p) => p.netPosition < 0).map((p) => ({ ...p }))

    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const settlementAmount = Math.min(creditor.netPosition, Math.abs(debtor.netPosition))

      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor.playerId,
          fromName: debtor.playerName,
          to: creditor.playerId,
          toName: creditor.playerName,
          amount: settlementAmount,
        })

        creditor.netPosition -= settlementAmount
        debtor.netPosition += settlementAmount
      }

      if (Math.abs(creditor.netPosition) < 0.01) creditorIndex++
      if (Math.abs(debtor.netPosition) < 0.01) debtorIndex++
    }

    return settlements
  }, [playerBalances, chipCountsEntered])

  // Calculate summary statistics
  const totalBuyIns = sessionTransactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
  const totalCashOuts = sessionTransactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
  const totalPayments = sessionTransactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + t.amount, 0)
  const totalFinalChipValue = chipCounts.reduce((sum, c) => sum + c.chipValue, 0)

  // For chip-based settlement, the balance should be:
  // Total buy-ins = Total cash-outs + Total final chip value - Total payments
  const expectedBalance = totalBuyIns + totalPayments
  const actualBalance = totalCashOuts + totalFinalChipValue
  const netDifference = actualBalance - expectedBalance
  const isBalanced = Math.abs(netDifference) < 0.01

  const handleChipCountChange = (playerId: string, value: string) => {
    const numValue = Number.parseFloat(value.replace(",", ".")) || 0 // Replace comma with dot for parsing
    setChipCounts((prev) =>
      prev.map((count) => (count.playerId === playerId ? { ...count, chipValue: numValue } : count)),
    )
  }

  const handleCalculateSettlement = () => {
    if (chipCounts.some((c) => c.chipValue < 0)) {
      toast({
        title: "Valores de ficha inválidos",
        description: "Os valores das fichas não podem ser negativos.",
        variant: "destructive",
      })
      return
    }

    setChipCountsEntered(true)
    setActiveTab("settlement")
    toast({
      title: "Acerto de contas calculado",
      description: "As contagens finais de fichas foram processadas e o acerto de contas calculado.",
    })
  }

  const handleCopySettlement = () => {
    const settlementText = optimalSettlements
      .map((s) => `${s.fromName} paga ${s.toName}: R$${s.amount.toFixed(2).replace(".", ",")}`)
      .join("\n")

    navigator.clipboard.writeText(settlementText)
    toast({
      title: "Acerto de contas copiado",
      description: "Os detalhes do acerto de contas foram copiados para a área de transferência.",
    })
  }

  const resetChipCounts = () => {
    setChipCounts(
      sessionPlayers.map((player) => ({
        playerId: player.id,
        chipValue: 0,
      })),
    )
    setChipCountsEntered(false)
    setActiveTab("chip-counts")
  }

  if (!session) {
    return null
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Acertar Contas - {session.name}
          </DialogTitle>
          <DialogDescription>
            Insira as contagens finais de fichas e calcule os acertos entre jogadores
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="chip-counts">Contagem Final de Fichas</TabsTrigger>
            <TabsTrigger value="settlement" disabled={!chipCountsEntered}>
              Acerto de Contas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Session Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Jogadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionPlayers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Total de Buy-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">R${totalBuyIns.toFixed(2).replace(".", ",")}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Total de Cash-outs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R${totalCashOuts.toFixed(2).replace(".", ",")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-blue-500" />
                    Fichas Finais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R${totalFinalChipValue.toFixed(2).replace(".", ",")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chipCountsEntered ? "Inserido" : "Não inserido"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo das Transações</CardTitle>
                <CardDescription>Visão geral de todas as transações nesta sessão</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {playerBalances.map((balance) => (
                      <TableRow key={balance.playerId}>
                        <TableCell className="font-medium">{balance.playerName}</TableCell>
                        <TableCell className="text-right text-red-600">
                          R${balance.buyIns.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          R${balance.cashOuts.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          R${balance.payments.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-right">{balance.transactionCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={() => setActiveTab("chip-counts")} size="lg">
                <Coins className="h-4 w-4 mr-2" />
                Inserir Contagens Finais de Fichas
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chip-counts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inserir Contagens Finais de Fichas</CardTitle>
                <CardDescription>
                  Insira o valor total das fichas que cada jogador tem no final da sessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sessionPlayers.map((player) => {
                    const chipCount = chipCounts.find((c) => c.playerId === player.id)
                    return (
                      <div key={player.id} className="flex items-center gap-4">
                        <Label className="w-32 font-medium">{player.name}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            type="text" // Use text to allow comma input
                            inputMode="decimal"
                            value={chipCount?.chipValue.toFixed(2).replace(".", ",") || ""}
                            onChange={(e) => handleChipCountChange(player.id, e.target.value)}
                            placeholder="0,00"
                            className="w-32"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Valor Total Final das Fichas</div>
                    <div className="text-2xl font-bold text-blue-600">
                      R${totalFinalChipValue.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetChipCounts}>
                      Redefinir
                    </Button>
                    <Button onClick={handleCalculateSettlement}>Calcular Acerto de Contas</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick chip value calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Valor de Fichas</CardTitle>
                <CardDescription>Use seus tipos de fichas configurados para calcular valores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {chips.map((chip) => (
                    <div key={chip.id} className="text-center p-3 border rounded-lg">
                      <div className="text-sm font-medium">{chip.color}</div>
                      <div className="text-lg font-bold">R${chip.value.toFixed(2).replace(".", ",")}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlement" className="space-y-6">
            {/* Balance Check */}
            <Card className={isBalanced ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isBalanced ? "text-green-800" : "text-yellow-800"}`}>
                  {isBalanced ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  Verificação de Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total Esperado:</div>
                    <div>R${expectedBalance.toFixed(2).replace(".", ",")}</div>
                    <div className="text-xs text-muted-foreground">Buy-ins + Pagamentos</div>
                  </div>
                  <div>
                    <div className="font-medium">Total Real:</div>
                    <div>R${actualBalance.toFixed(2).replace(".", ",")}</div>
                    <div className="text-xs text-muted-foreground">Cash-outs + Fichas Finais</div>
                  </div>
                </div>
                {!isBalanced && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800 font-medium">
                      Diferença: R${Math.abs(netDifference).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {netDifference > 0
                        ? "Mais dinheiro/fichas do que o esperado. Verifique se há buy-ins faltando."
                        : "Menos dinheiro/fichas do que o esperado. Verifique se há cash-outs ou contagens de fichas faltando."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player Final Positions */}
            <Card>
              <CardHeader>
                <CardTitle>Posições Finais dos Jogadores</CardTitle>
                <CardDescription>
                  Posição líquida incluindo valores finais de fichas (positivo = recebe dinheiro, negativo = paga
                  dinheiro)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead className="text-right">Buy-ins</TableHead>
                      <TableHead className="text-right">Cash-outs</TableHead>
                      <TableHead className="text-right">Fichas Finais</TableHead>
                      <TableHead className="text-right">Posição Líquida</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerBalances.map((balance) => (
                      <TableRow key={balance.playerId}>
                        <TableCell className="font-medium">{balance.playerName}</TableCell>
                        <TableCell className="text-right text-red-600">
                          R${balance.buyIns.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          R${balance.cashOuts.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          R${balance.finalChipValue.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            balance.netPosition > 0
                              ? "text-green-600"
                              : balance.netPosition < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {balance.netPosition >= 0 ? "+" : ""}R${balance.netPosition.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              balance.netPosition > 0
                                ? "default"
                                : balance.netPosition < 0
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {balance.netPosition > 0 ? "Recebe" : balance.netPosition < 0 ? "Paga" : "Equilibrado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Settlement Recommendations */}
            {optimalSettlements.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Acerto de Contas Entre Jogadores</CardTitle>
                      <CardDescription>Transações ótimas para acertar todos os jogadores</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleCopySettlement}>
                      Copiar Acerto de Contas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimalSettlements.map((settlement, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-medium">{settlement.fromName}</div>
                            <Badge variant="destructive" className="text-xs">
                              Paga
                            </Badge>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <div className="text-center">
                            <div className="font-medium">{settlement.toName}</div>
                            <Badge variant="default" className="text-xs">
                              Recebe
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            R${settlement.amount.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="text-center text-sm text-muted-foreground">
                    <p>Total de acertos necessários: {optimalSettlements.length}</p>
                    <p>
                      Valor total a ser transferido: R$
                      {optimalSettlements
                        .reduce((sum, s) => sum + s.amount, 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No settlements needed */}
            {optimalSettlements.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Todos Equilibrados!</h3>
                  <p className="text-muted-foreground">
                    Nenhum acerto de contas é necessário. Todos os jogadores estão equilibrados após considerar os
                    valores finais das fichas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={resetChipCounts} disabled={!chipCountsEntered}>
            Redefinir Contagens de Fichas
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
