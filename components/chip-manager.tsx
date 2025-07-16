"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

const chipColors = [
  { name: "Branco", value: "white", bg: "bg-white", border: "border-gray-300" },
  { name: "Vermelho", value: "red", bg: "bg-red-500", border: "border-red-600" },
  { name: "Verde", value: "green", bg: "bg-green-500", border: "border-green-600" },
  { name: "Azul", value: "blue", bg: "bg-blue-500", border: "border-blue-600" },
  { name: "Preto", value: "black", bg: "bg-black", border: "border-gray-800" },
  { name: "Roxo", value: "purple", bg: "bg-purple-500", border: "border-purple-600" },
  { name: "Amarelo", value: "yellow", bg: "bg-yellow-400", border: "border-yellow-500" },
  { name: "Laranja", value: "orange", bg: "bg-orange-500", border: "border-orange-600" },
]

export function ChipManager() {
  const { chips, addChipType, updateChipType, deleteChipType, updateChipCount } = usePokerStore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRecountDialogOpen, setIsRecountDialogOpen] = useState(false)
  const [editingChip, setEditingChip] = useState<string | null>(null)
  const [recountChip, setRecountChip] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    color: "",
    value: "",
    count: "",
  })
  const [recountValue, setRecountValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const chipData = {
      color: formData.color,
      value: Number.parseFloat(formData.value),
      count: Number.parseInt(formData.count),
    }

    if (editingChip) {
      updateChipType(editingChip, chipData)
      toast({
        title: "Tipo de ficha atualizado",
        description: "O tipo de ficha foi atualizado com sucesso.",
      })
    } else {
      addChipType(chipData)
      toast({
        title: "Tipo de ficha adicionado",
        description: "Novo tipo de ficha adicionado com sucesso.",
      })
    }

    setIsDialogOpen(false)
    setEditingChip(null)
    setFormData({ color: "", value: "", count: "" })
  }

  const handleEdit = (chip: any) => {
    setEditingChip(chip.id)
    setFormData({
      color: chip.color,
      value: chip.value.toString(),
      count: chip.count.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteChipType(id)
    toast({
      title: "Tipo de ficha excluído",
      description: "O tipo de ficha foi excluído com sucesso.",
    })
  }

  const handleRecount = (chip: any) => {
    setRecountChip(chip.id)
    setRecountValue(chip.count.toString())
    setIsRecountDialogOpen(true)
  }

  const handleRecountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (recountChip) {
      updateChipCount(recountChip, Number.parseInt(recountValue))
      toast({
        title: "Contagem de fichas atualizada",
        description: "A contagem de fichas foi atualizada com sucesso.",
      })
    }
    setIsRecountDialogOpen(false)
    setRecountChip(null)
    setRecountValue("")
  }

  const getChipColorInfo = (color: string) => {
    return chipColors.find((c) => c.value === color) || chipColors[0]
  }

  const totalChipValue = chips.reduce((sum, chip) => sum + chip.value * chip.count, 0)
  const totalChipCount = chips.reduce((sum, chip) => sum + chip.count, 0)

  const sortedChips = [...chips].sort((a, b) => a.value - b.value)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Fichas</h2>
          <p className="text-muted-foreground">Configure tipos de fichas e gerencie o inventário</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingChip(null)
                setFormData({ color: "", value: "", count: "" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tipo de Ficha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChip ? "Editar Tipo de Ficha" : "Adicionar Novo Tipo de Ficha"}</DialogTitle>
              <DialogDescription>
                {editingChip ? "Atualize os detalhes do tipo de ficha" : "Configure uma nova denominação de ficha"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="color">Cor</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cor" />
                    </SelectTrigger>
                    <SelectContent>
                      {chipColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.bg} ${color.border} border-2`} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="1,00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="count">Contagem Inicial</Label>
                  <Input
                    id="count"
                    type="number"
                    min="0"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingChip ? "Atualizar Tipo de Ficha" : "Adicionar Tipo de Ficha"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Valor Total das Fichas</CardTitle>
            <CardDescription>Valor combinado de todas as fichas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">R${totalChipValue.toFixed(2).replace(".", ",")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contagem Total de Fichas</CardTitle>
            <CardDescription>Número de fichas físicas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalChipCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Fichas</CardTitle>
            <CardDescription>Diferentes denominações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{chips.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {sortedChips.map((chip) => {
          const colorInfo = getChipColorInfo(chip.color)
          const chipValue = chip.value * chip.count

          return (
            <Card key={chip.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full ${colorInfo.bg} ${colorInfo.border} border-4 flex items-center justify-center shadow-lg`}
                    >
                      <span
                        className={`text-sm font-bold ${chip.color === "white" || chip.color === "yellow" ? "text-black" : "text-white"}`}
                      >
                        R${chip.value}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Fichas {colorInfo.name}
                        <Badge variant="outline">R${chip.value}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {chip.count} fichas • Valor total: R${chipValue.toFixed(2).replace(".", ",")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRecount(chip)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Recontar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(chip)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(chip.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
        {chips.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum tipo de ficha configurado ainda. Adicione seu primeiro tipo de ficha para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isRecountDialogOpen} onOpenChange={setIsRecountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recontar Fichas</DialogTitle>
            <DialogDescription>Atualize a contagem atual para este tipo de ficha</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecountSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="recountValue">Nova Contagem</Label>
                <Input
                  id="recountValue"
                  type="number"
                  min="0"
                  value={recountValue}
                  onChange={(e) => setRecountValue(e.target.value)}
                  placeholder="Insira a nova contagem"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Atualizar Contagem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
