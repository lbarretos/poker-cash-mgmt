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
import { Plus, Edit, Trash2, Play, Square, Calculator } from "lucide-react"
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
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
    })
    toast({
      title: `Sessão ${newStatus === "active" ? "reativada" : "concluída"}`,
      description: `A sessão foi ${newStatus === "active" ? "reativada" : "concluída"}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Sessões</h2>
          <p className="text-muted-foreground">Crie e gerencie suas sessões de poker</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSession(null)
                setFormData({ name: "", tableCount: 1, notes: "" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSession ? "Editar Sessão" : "Criar Nova Sessão"}</DialogTitle>
              <DialogDescription>
                {editingSession ? "Atualize os detalhes da sessão" : "Insira os detalhes para sua nova sessão de poker"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Sessão</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Poker da Sexta à Noite"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tableCount">Número de Mesas</Label>
                  <Select
                    value={formData.tableCount.toString()}
                    onValueChange={(value) => setFormData({ ...formData, tableCount: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas da sessão..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingSession ? "Atualizar Sessão" : "Criar Sessão"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {session.name}
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {session.status === "active" ? "Ativa" : "Concluída"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Criada em: {new Date(session.createdAt).toLocaleString("pt-BR")}
                    {session.completedAt && (
                      <span className="ml-4">
                        Concluída em: {new Date(session.completedAt).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Mesas:</span> {session.tableCount}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {session.status === "active" ? "Ativa" : "Concluída"}
                </div>
                {session.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notas:</span> {session.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma sessão criada ainda. Crie sua primeira sessão para começar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {settleUpSession && <SettleUp sessionId={settleUpSession} onClose={() => setSettleUpSession(null)} />}
    </div>
  )
}
