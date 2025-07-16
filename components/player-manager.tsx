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
import { Plus, Edit, Trash2, User, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gerenciamento de Jogadores</h2>
          <p className="text-sm text-muted-foreground">Gerencie perfis e informações de jogadores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPlayer(null)
                setFormData({ name: "", email: "", phone: "", notes: "" })
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Jogador
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingPlayer ? "Editar Jogador" : "Adicionar Novo Jogador"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingPlayer ? "Atualize as informações do jogador" : "Insira os detalhes para o novo jogador"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="João da Silva"
                    required
                    className="text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email (Opcional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                    className="text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone (Opcional)
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+55 (11) 98765-4321"
                    className="text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notas (Opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas do jogador..."
                    className="text-base min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  {editingPlayer ? "Atualizar Jogador" : "Adicionar Jogador"}
                </Button>
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
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">{player.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Entrou em: {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden sm:flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(player)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(player.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Actions */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEdit(player)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(player.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-4">
                  {/* Contact Info */}
                  {(player.email || player.phone || player.notes) && (
                    <div className="space-y-2">
                      {player.email && (
                        <div className="text-sm">
                          <span className="font-medium">Email:</span>
                          <span className="ml-1 break-all">{player.email}</span>
                        </div>
                      )}
                      {player.phone && (
                        <div className="text-sm">
                          <span className="font-medium">Telefone:</span>
                          <span className="ml-1">{player.phone}</span>
                        </div>
                      )}
                      {player.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notas:</span>
                          <p className="mt-1 text-muted-foreground break-words">{player.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Transações:</span> {stats.totalTransactions}
                    </div>
                    <div>
                      <span className="font-medium">Buy-ins:</span> R${stats.totalBuyIns.toFixed(2).replace(".", ",")}
                    </div>
                    <div>
                      <span className="font-medium">Cash-outs:</span> R$
                      {stats.totalCashOuts.toFixed(2).replace(".", ",")}
                    </div>
                    <div>
                      <span className="font-medium">Líquido:</span>
                      <span
                        className={`ml-1 font-semibold ${stats.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
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
              <p className="text-muted-foreground text-sm">
                Nenhum jogador adicionado ainda. Adicione seu primeiro jogador para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
