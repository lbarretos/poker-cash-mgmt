import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CheckDbPage() {
  // Server-side environment check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envStatus = {
    url: supabaseUrl || 'NÃO DEFINIDA',
    anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
    urlStatus: !!supabaseUrl,
    anonKeyStatus: !!supabaseAnonKey,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">Verificação do Banco de Dados (Server-Side)</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Variáveis de Ambiente (Server-Side)</CardTitle>
            <CardDescription>Status das variáveis de ambiente do Supabase no servidor</CardDescription>
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
            <CardTitle>Informações de Debug</CardTitle>
            <CardDescription>Informações técnicas sobre o ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'NÃO DEFINIDA'}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}
            </div>
            <div>
              <strong>Next.js Version:</strong> {process.env.npm_package_dependencies_next || 'Desconhecida'}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div>
            <a 
              href="/test-env" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mr-2"
            >
              Ver Teste Client-Side
            </a>
            <a 
              href="/login" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 