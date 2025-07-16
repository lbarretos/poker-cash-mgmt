"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2, User } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export function PlayerManager() {
  const { players, transactions, addPlayer, updatePlayer, deletePlayer } = usePokerStore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPlayer) {
      updatePlayer(editingPlayer, formData)
      toast({
        title: "Jogador atualizado",
        description: "As informações do jogador foram atualizadas com sucesso.",
      })
    } else {
      addPlayer(formData)
      toast({
        title: "Jogador adicionado",
        description: "Novo jogador adicionado com sucesso.",
      })
    }

    setIsDialogOpen(false)
    setEditingPlayer(null)
    setFormData({ name: "", email: "", phone: "", notes: "" })
  }

  const handleEdit = (player: any) => {
    setEditingPlayer(player.id)
    setFormData({
      name: player.name,
      email: player.email || "",
      phone: player.phone || "",
      notes: player.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deletePlayer(id)
    toast({
      title: "Jogador excluído",
      description: "O jogador foi excluído com sucesso.",
    })
  }

  const getPlayerStats = (playerId: string) => {
    const playerTransactions = transactions.filter((t) => t.playerId === playerId)
    const buyIns = playerTransactions.filter((t) => t.type === "buy-in").reduce((sum, t) => sum + t.amount, 0)
    const cashOuts = playerTransactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
    const payments = playerTransactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + t.amount, 0)

    return {
      totalTransactions: playerTransactions.length,
      totalBuyIns: buyIns,
      totalCashOuts: cashOuts,
      totalPayments: payments,
      netAmount: cashOuts - buyIns,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Jogadores</h2>
          <p className="text-muted-foreground">Gerencie perfis e informações de jogadores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPlayer(null)
                setFormData({ name: "", email: "", phone: "", notes: "" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Jogador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Editar Jogador" : "Adicionar Novo Jogador"}</DialogTitle>
              <DialogDescription>
                {editingPlayer ? "Atualize as informações do jogador" : "Insira os detalhes para o novo jogador"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="João da Silva"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email (Opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone (Opcional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+55 (11) 98765-4321"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas do jogador..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingPlayer ? "Atualizar Jogador" : "Adicionar Jogador"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {players.map((player) => {
          const stats = getPlayerStats(player.id)

          return (
            <Card key={player.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>{player.name}</CardTitle>
                      <CardDescription>
                        Entrou em: {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(player)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(player.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {player.email && (
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {player.email}
                      </div>
                    )}
                    {player.phone && (
                      <div className="text-sm">
                        <span className="font-medium">Telefone:</span> {player.phone}
                      </div>
                    )}
                    {player.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Notas:</span> {player.notes}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Transações:</span> {stats.totalTransactions}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total de Buy-ins:</span> R$
                      {stats.totalBuyIns.toFixed(2).replace(".", ",")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total de Cash-outs:</span> R$
                      {stats.totalCashOuts.toFixed(2).replace(".", ",")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Valor Líquido:</span>
                      <span className={`ml-1 ${stats.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {stats.netAmount >= 0 ? "+" : ""}R${stats.netAmount.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {players.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum jogador adicionado ainda. Adicione seu primeiro jogador para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
