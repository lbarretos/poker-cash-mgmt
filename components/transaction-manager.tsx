"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, CreditCard } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export function TransactionManager() {
  const { transactions, sessions, players, addTransaction, updateTransaction, deleteTransaction } = usePokerStore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sessionId: "",
    playerId: "",
    type: "buy-in" as "buy-in" | "cash-out" | "payment",
    amount: "",
    tableNumber: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const transactionData = {
      sessionId: formData.sessionId,
      playerId: formData.playerId,
      type: formData.type,
      amount: Number.parseFloat(formData.amount),
      tableNumber: formData.tableNumber ? Number.parseInt(formData.tableNumber) : undefined,
      notes: formData.notes || undefined,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction, transactionData)
      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      })
    } else {
      addTransaction(transactionData)
      toast({
        title: "Transação adicionada",
        description: "Nova transação adicionada com sucesso.",
      })
    }

    setIsDialogOpen(false)
    setEditingTransaction(null)
    setFormData({
      sessionId: "",
      playerId: "",
      type: "buy-in",
      amount: "",
      tableNumber: "",
      notes: "",
    })
  }

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction.id)
    setFormData({
      sessionId: transaction.sessionId,
      playerId: transaction.playerId,
      type: transaction.type,
      amount: transaction.amount.toString(),
      tableNumber: transaction.tableNumber?.toString() || "",
      notes: transaction.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    toast({
      title: "Transação excluída",
      description: "A transação foi excluída com sucesso.",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy-in":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />
      case "cash-out":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />
      case "payment":
        return <CreditCard className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "buy-in":
        return "destructive"
      case "cash-out":
        return "default"
      case "payment":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "buy-in":
        return "Buy-in"
      case "cash-out":
        return "Cash-out"
      case "payment":
        return "Pagamento"
      default:
        return type
    }
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Transações</h2>
          <p className="text-muted-foreground">Registre buy-ins, cash-outs e pagamentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTransaction(null)
                setFormData({
                  sessionId: "",
                  playerId: "",
                  type: "buy-in",
                  amount: "",
                  tableNumber: "",
                  notes: "",
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Editar Transação" : "Adicionar Nova Transação"}</DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? "Atualize os detalhes da transação"
                  : "Registre um novo buy-in, cash-out ou pagamento"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sessionId">Sessão</Label>
                  <Select
                    value={formData.sessionId}
                    onValueChange={(value) => setFormData({ ...formData, sessionId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar sessão" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name} ({session.status === "active" ? "Ativa" : "Concluída"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="playerId">Jogador</Label>
                  <Select
                    value={formData.playerId}
                    onValueChange={(value) => setFormData({ ...formData, playerId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Transação</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "buy-in" | "cash-out" | "payment") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy-in">Buy-in</SelectItem>
                      <SelectItem value="cash-out">Cash-out</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100,00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tableNumber">Número da Mesa (Opcional)</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    min="1"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas da transação..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingTransaction ? "Atualizar Transação" : "Adicionar Transação"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sortedTransactions.map((transaction) => {
          const session = sessions.find((s) => s.id === transaction.sessionId)
          const player = players.find((p) => p.id === transaction.playerId)

          return (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {player?.name || "Jogador Desconhecido"}
                        <Badge variant={getTransactionColor(transaction.type) as any}>
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {session?.name || "Sessão Desconhecida"} •{" "}
                        {new Date(transaction.timestamp).toLocaleString("pt-BR")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === "buy-in"
                          ? "text-red-600"
                          : transaction.type === "cash-out"
                            ? "text-green-600"
                            : "text-blue-600"
                      }`}
                    >
                      {transaction.type === "buy-in" ? "-" : "+"}R${transaction.amount.toFixed(2).replace(".", ",")}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {(transaction.tableNumber || transaction.notes) && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {transaction.tableNumber && (
                      <div>
                        <span className="font-medium">Mesa:</span> {transaction.tableNumber}
                      </div>
                    )}
                    {transaction.notes && (
                      <div className="col-span-2">
                        <span className="font-medium">Notas:</span> {transaction.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
        {transactions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma transação registrada ainda. Adicione sua primeira transação para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
