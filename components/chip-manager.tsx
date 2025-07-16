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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gerenciamento de Fichas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure tipos de fichas e gerencie o inventário
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingChip(null)
                setFormData({ color: "", value: "", count: "" })
              }}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Adicionar Tipo de Ficha</span>
              <span className="sm:hidden">Adicionar Ficha</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingChip ? "Editar Tipo de Ficha" : "Adicionar Novo Tipo de Ficha"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingChip ? "Atualize os detalhes do tipo de ficha" : "Configure uma nova denominação de ficha"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="color" className="text-sm font-medium">
                    Cor
                  </Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                    required
                  >
                    <SelectTrigger className="min-h-[44px] touch-manipulation">
                      <SelectValue placeholder="Selecionar cor" />
                    </SelectTrigger>
                    <SelectContent>
                      {chipColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} className="min-h-[44px]">
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
                  <Label htmlFor="value" className="text-sm font-medium">
                    Valor (R$)
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="1,00"
                    className="min-h-[44px] touch-manipulation"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="count" className="text-sm font-medium">
                    Contagem Inicial
                  </Label>
                  <Input
                    id="count"
                    type="number"
                    min="0"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                    placeholder="100"
                    className="min-h-[44px] touch-manipulation"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                  {editingChip ? "Atualizar Tipo de Ficha" : "Adicionar Tipo de Ficha"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="min-h-[100px] sm:min-h-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Valor Total das Fichas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Valor combinado de todas as fichas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              R${totalChipValue.toFixed(2).replace(".", ",")}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[100px] sm:min-h-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Contagem Total de Fichas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Número de fichas físicas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{totalChipCount}</div>
          </CardContent>
        </Card>

        <Card className="min-h-[100px] sm:min-h-[120px] sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Tipos de Fichas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Diferentes denominações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{chips.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {sortedChips.map((chip) => {
          const colorInfo = getChipColorInfo(chip.color)
          const chipValue = chip.value * chip.count

          return (
            <Card key={chip.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${colorInfo.bg} ${colorInfo.border} border-4 flex items-center justify-center shadow-lg flex-shrink-0`}
                    >
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          chip.color === "white" || chip.color === "yellow" ? "text-black" : "text-white"
                        }`}
                      >
                        R${chip.value}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
                        <span>Fichas {colorInfo.name}</span>
                        <Badge variant="outline" className="text-xs w-fit">
                          R${chip.value}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {chip.count} fichas • Valor total: R${chipValue.toFixed(2).replace(".", ",")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecount(chip)}
                      className="flex-1 sm:flex-none min-h-[36px] touch-manipulation text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Recontar</span>
                      <span className="sm:hidden">Recontar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(chip)}
                      className="min-h-[36px] touch-manipulation"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(chip.id)}
                      className="min-h-[36px] touch-manipulation"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
        {chips.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-muted-foreground">
                Nenhum tipo de ficha configurado ainda. Adicione seu primeiro tipo de ficha para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isRecountDialogOpen} onOpenChange={setIsRecountDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Recontar Fichas</DialogTitle>
            <DialogDescription className="text-sm">Atualize a contagem atual para este tipo de ficha</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecountSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="recountValue" className="text-sm font-medium">
                  Nova Contagem
                </Label>
                <Input
                  id="recountValue"
                  type="number"
                  min="0"
                  value={recountValue}
                  onChange={(e) => setRecountValue(e.target.value)}
                  placeholder="Insira a nova contagem"
                  className="min-h-[44px] touch-manipulation"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                Atualizar Contagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
