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
import { Plus, Edit, Trash2, Play, Square, Calculator, MoreVertical, Calendar, Clock, Table, FileText, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePokerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { SettleUp } from "./settle-up"

export function SessionManager() {
  const { sessions, addSession, updateSession, deleteSession } = usePokerStore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    tableCount: 1,
    notes: "",
  })
  const [settleUpSession, setSettleUpSession] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingSession) {
      updateSession(editingSession, formData)
      toast({
        title: "Sessão atualizada",
        description: "A sessão foi atualizada com sucesso.",
      })
    } else {
      addSession({
        ...formData,
        status: "active",
      })
      toast({
        title: "Sessão criada",
        description: "Nova sessão criada com sucesso.",
      })
    }

    setIsDialogOpen(false)
    setEditingSession(null)
    setFormData({ name: "", tableCount: 1, notes: "" })
  }

  const handleEdit = (session: any) => {
    setEditingSession(session.id)
    setFormData({
      name: session.name,
      tableCount: session.tableCount,
      notes: session.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteSession(id)
    toast({
      title: "Sessão excluída",
      description: "A sessão foi excluída com sucesso.",
    })
  }

  const toggleSessionStatus = (session: any) => {
    const newStatus = session.status === "active" ? "completed" : "active"
    updateSession(session.id, {
      status: newStatus,
      end_time: newStatus === "completed" ? new Date().toISOString() : undefined,
    })
    toast({
      title: `Sessão ${newStatus === "active" ? "reativada" : "concluída"}`,
      description: `A sessão foi ${newStatus === "active" ? "reativada" : "concluída"}.`,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gerenciamento de Sessões</h2>
          <p className="text-sm text-muted-foreground">Crie e gerencie suas sessões de poker</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSession(null)
                setFormData({ name: "", tableCount: 1, notes: "" })
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{editingSession ? "Editar Sessão" : "Criar Nova Sessão"}</DialogTitle>
              <DialogDescription className="text-sm">
                {editingSession ? "Atualize os detalhes da sessão" : "Insira os detalhes para sua nova sessão de poker"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome da Sessão
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Poker da Sexta à Noite"
                    required
                    className="text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tableCount" className="text-sm font-medium">
                    Número de Mesas
                  </Label>
                  <Select
                    value={formData.tableCount.toString()}
                    onValueChange={(value) => setFormData({ ...formData, tableCount: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Mesa{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notas (Opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas da sessão..."
                    className="text-base min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  {editingSession ? "Atualizar Sessão" : "Criar Sessão"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                {/* Header com título e status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl mb-2">
                      <span className="truncate">{session.name}</span>
                      <Badge
                        variant={session.status === "active" ? "default" : "secondary"}
                        className="text-xs shrink-0 px-2 py-1"
                      >
                        {session.status === "active" ? "Ativa" : "Concluída"}
                      </Badge>
                    </CardTitle>

                    {/* Informações principais com ícones */}
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Criada em: {new Date(session.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {session.end_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Concluída em: {new Date(session.end_time).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden sm:flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleSessionStatus(session)}>
                      {session.status === "active" ? (
                        <>
                          <Square className="h-4 w-4 mr-1" />
                          Concluir
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Reativar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSettleUpSession(session.id)}>
                      <Calculator className="h-4 w-4 mr-1" />
                      Acertar Contas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(session)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(session.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Actions */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => toggleSessionStatus(session)}>
                          {session.status === "active" ? (
                            <>
                              <Square className="h-4 w-4 mr-2" />
                              Concluir Sessão
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Reativar Sessão
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSettleUpSession(session.id)}>
                          <Calculator className="h-4 w-4 mr-2" />
                          Acertar Contas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(session)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(session.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Mobile Actions Bar */}
                <div className="sm:hidden flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSessionStatus(session)}
                    className="flex-1 h-10"
                  >
                    {session.status === "active" ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Concluir
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Reativar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettleUpSession(session.id)}
                    className="flex-1 h-10"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Acertar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(session)}
                    className="h-10 w-10 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Informações detalhadas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                    <Table className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{session.tableCount || 1}</div>
                      <div className="text-xs text-muted-foreground">
                        Mesa{(session.tableCount ||1) > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {session.status === "active" ? "Ativa" : "Concluída"}
                      </div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {session.notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Notas</span>
                    </div>
                    <p className="text-sm text-muted-foreground break-words leading-relaxed">
                      {session.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-3 mx-auto w-12 h-12 rounded-full flex items-center justify-center">
                <Table className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-base">Nenhuma sessão criada</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Crie sua primeira sessão para começar a gerenciar suas partidas de poker!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {settleUpSession && <SettleUp sessionId={settleUpSession} onClose={() => setSettleUpSession(null)} />}
    </div>
  )
}
