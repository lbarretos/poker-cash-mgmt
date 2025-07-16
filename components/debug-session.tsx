"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, RefreshCw } from "lucide-react"

interface SessionInfo {
  hasSession: boolean
  userEmail?: string
  userId?: string
  expiresAt?: string
  accessToken?: string
  refreshToken?: string
  error?: string
  timestamp: string
}

export function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const checkSession = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
      console.log("🔍 DEBUG: Verificando sessão...")
    }
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      const info: SessionInfo = {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString('pt-BR') : undefined,
        accessToken: session?.access_token?.substring(0, 20) + (session?.access_token ? '...' : ''),
        refreshToken: session?.refresh_token?.substring(0, 20) + (session?.refresh_token ? '...' : ''),
        error: error?.message,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      }
      
      setSessionInfo(info)
      
      if (process.env.NODE_ENV === 'development') {
      console.log("📊 DEBUG: Session info:", info)
    }
      
    } catch (err: any) {
      setSessionInfo({
        hasSession: false,
        error: err.message,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      })
    }
  }

  useEffect(() => {
    checkSession()
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔄 DEBUG: Auth state change:", event)
      }
      checkSession()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      interval = setInterval(checkSession, 2000) // A cada 2 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Debug Session
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Session</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
                variant={autoRefresh ? "default" : "outline"}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </Button>
              <Button
                onClick={checkSession}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {sessionInfo ? (
            <>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={sessionInfo.hasSession ? "default" : "destructive"}>
                  {sessionInfo.hasSession ? "Logado" : "Não logado"}
                </Badge>
              </div>
              
              {sessionInfo.userEmail && (
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="font-mono text-xs truncate max-w-32">
                    {sessionInfo.userEmail}
                  </span>
                </div>
              )}
              
              {sessionInfo.userId && (
                <div className="flex items-center justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs truncate max-w-32">
                    {sessionInfo.userId.substring(0, 8)}...
                  </span>
                </div>
              )}
              
              {sessionInfo.expiresAt && (
                <div className="flex items-center justify-between">
                  <span>Expira:</span>
                  <span className="text-xs">
                    {sessionInfo.expiresAt.split(' ')[1]}
                  </span>
                </div>
              )}
              
              {sessionInfo.accessToken && (
                <div className="flex items-center justify-between">
                  <span>Token:</span>
                  <span className="font-mono text-xs">
                    {sessionInfo.accessToken}
                  </span>
                </div>
              )}
              
              {sessionInfo.error && (
                <div className="text-red-600 text-xs p-2 bg-red-50 rounded">
                  Error: {sessionInfo.error}
                </div>
              )}
              
              <div className="text-gray-500 text-xs text-center pt-2 border-t">
                Última verificação: {sessionInfo.timestamp}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 