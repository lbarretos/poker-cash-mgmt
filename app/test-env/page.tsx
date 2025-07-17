"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

export default function TestEnvPage() {
  const [envStatus, setEnvStatus] = useState({
    url: '',
    anonKey: '',
    urlStatus: false,
    anonKeyStatus: false,
  })
  
  const [supabaseTest, setSupabaseTest] = useState({
    connected: false,
    error: '',
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Garantir que estamos no cliente após a hidratação
    setIsClient(true)
    
    // Testar variáveis de ambiente após hidratação
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔍 Client-side env check:', { url: !!url, anonKey: !!anonKey })
    
    setEnvStatus({
      url: url || 'NÃO DEFINIDA',
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
      urlStatus: !!url,
      anonKeyStatus: !!anonKey,
    })

    // Testar conexão com Supabase
    const testSupabase = async () => {
      try {
        console.log('🔍 Testing Supabase connection...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Supabase error:', error)
          setSupabaseTest({
            connected: false,
            error: `Erro na sessão: ${error.message}`,
          })
        } else {
          console.log('✅ Supabase connection OK')
          setSupabaseTest({
            connected: true,
            error: '',
          })
        }
      } catch (err: any) {
        console.error('❌ Supabase connection error:', err)
        setSupabaseTest({
          connected: false,
          error: `Erro de conexão: ${err.message}`,
        })
      }
    }

    testSupabase()
  }, [])

  // Mostrar loading até a hidratação estar completa
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando teste de ambiente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">Teste de Ambiente (Client-Side)</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Variáveis de Ambiente (Client-Side)</CardTitle>
            <CardDescription>Status das variáveis de ambiente do Supabase no cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{envStatus.url}</code>
                <Badge variant={envStatus.urlStatus ? "default" : "destructive"}>
                  {envStatus.urlStatus ? "OK" : "ERRO"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{envStatus.anonKey}</code>
                <Badge variant={envStatus.anonKeyStatus ? "default" : "destructive"}>
                  {envStatus.anonKeyStatus ? "OK" : "ERRO"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Conexão Supabase</CardTitle>
            <CardDescription>Status da conexão com o Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status da Conexão:</span>
              <div className="flex items-center gap-2">
                <Badge variant={supabaseTest.connected ? "default" : "destructive"}>
                  {supabaseTest.connected ? "CONECTADO" : "ERRO"}
                </Badge>
              </div>
            </div>
            
            {supabaseTest.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{supabaseTest.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Debug</CardTitle>
            <CardDescription>Informações técnicas sobre o estado do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Cliente Hidratado:</strong> {isClient ? 'SIM' : 'NÃO'}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}
            </div>
            <div>
              <strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div>
            <a 
              href="/check-db" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mr-2"
            >
              Ver Teste Server-Side
            </a>
            <a 
              href="/login" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Voltar ao Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 