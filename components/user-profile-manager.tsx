"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { User, Edit, Mail, Phone, Key } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface UserProfileData {
  id: string
  email?: string
  created_at: string
  user_metadata?: {
    name?: string
    phone?: string
  }
}

export function UserProfileManager() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const loadUserProfile = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Erro ao carregar perfil do usuário:', error)
        return
      }

      if (user) {
        setUserProfile(user)
        setFormData({
          name: user.user_metadata?.name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
        })
      }
    } catch (error) {
      console.error('💥 Erro ao carregar perfil:', error)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('✏️ Atualizando perfil do usuário:', formData)

      // Atualizar user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
        }
      })

      if (updateError) {
        console.error('❌ Erro ao atualizar metadados:', updateError)
        toast({
          title: "Erro ao atualizar perfil",
          description: updateError.message,
          variant: "destructive",
        })
        return
      }

      // Atualizar email se mudou
      if (formData.email !== userProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })

        if (emailError) {
          console.error('❌ Erro ao atualizar email:', emailError)
          toast({
            title: "Erro ao atualizar email",
            description: emailError.message,
            variant: "destructive",
          })
          return
        }
      }

      console.log('✅ Perfil atualizado com sucesso')
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })

      // Recarregar perfil
      await loadUserProfile()
      setIsDialogOpen(false)

    } catch (error: any) {
      console.error('💥 Erro ao atualizar perfil:', error)
      toast({
        title: "Erro inesperado",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.user_metadata?.name || "",
        email: userProfile.email || "",
        phone: userProfile.user_metadata?.phone || "",
      })
    }
    setIsDialogOpen(true)
  }

  if (!userProfile) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Carregando perfil do usuário...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleEdit} className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Editar Perfil</DialogTitle>
              <DialogDescription className="text-sm">
                Atualize suas informações pessoais
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
                    placeholder="Seu nome completo"
                    className="text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="text-base"
                    required
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
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {userProfile.user_metadata?.name || "Nome não definido"}
              </CardTitle>
              <CardDescription>
                Membro desde: {new Date(userProfile.created_at).toLocaleDateString("pt-BR")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>
            
            {userProfile.user_metadata?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{userProfile.user_metadata.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">ID do Usuário</p>
                <p className="text-sm text-muted-foreground font-mono text-xs">{userProfile.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 