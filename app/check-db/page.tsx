"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { CheckCircle, AlertCircle, Database, Table, Shield } from "lucide-react"

export default function CheckDBPage() {
  const [dbStatus, setDbStatus] = useState<{
    tables: { name: string; exists: boolean; error?: string }[]
    rls: { table: string; enabled: boolean }[]
    user: any
  }>({
    tables: [],
    rls: [],
    user: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    setLoading(true)
    
    try {
      // Verificar usuário
      const { data: { user } } = await supabase.auth.getUser()
      
      const tables = ['players', 'sessions', 'transactions', 'chip_types']
      const tableStatus = []
      const rlsStatus = []

      // Verificar cada tabela
      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1)

          if (error) {
            tableStatus.push({ name: tableName, exists: false, error: error.message })
          } else {
            tableStatus.push({ name: tableName, exists: true })
          }
        } catch (err) {
          tableStatus.push({ name: tableName, exists: false, error: 'Erro ao acessar tabela' })
        }
      }

      // Verificar RLS (Row Level Security)
      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          // Se conseguiu acessar sem user_id, RLS pode não estar ativo
          if (!error && data && data.length > 0 && !data[0].user_id) {
            rlsStatus.push({ table: tableName, enabled: false })
          } else {
            rlsStatus.push({ table: tableName, enabled: true })
          }
        } catch (err) {
          rlsStatus.push({ table: tableName, enabled: false })
        }
      }

      setDbStatus({
        tables: tableStatus,
        rls: rlsStatus,
        user
      })

    } catch (error) {
      console.error('Erro ao verificar banco:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTables = async () => {
    setLoading(true)
    
    try {
      // SQL para criar tabelas (será executado via API ou manualmente)
      const sql = `
        -- Criar tabelas
        CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          table_count INTEGER DEFAULT 1,
          notes TEXT,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
          player_id UUID REFERENCES players(id) ON DELETE CASCADE,
          type TEXT CHECK (type IN ('buy-in', 'cash-out', 'payment')) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT,
          table_number INTEGER,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS chip_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          color TEXT NOT NULL,
          value INTEGER NOT NULL,
          count INTEGER DEFAULT 0,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        );

        -- Habilitar RLS
        ALTER TABLE players ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE chip_types ENABLE ROW LEVEL SECURITY;

        -- Criar políticas
        DROP POLICY IF EXISTS "Users can only access their own players" ON players;
        CREATE POLICY "Users can only access their own players" ON players
          FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can only access their own sessions" ON sessions;
        CREATE POLICY "Users can only access their own sessions" ON sessions
          FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can only access their own transactions" ON transactions;
        CREATE POLICY "Users can only access their own transactions" ON transactions
          FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can only access their own chip_types" ON chip_types;
        CREATE POLICY "Users can only access their own chip_types" ON chip_types
          FOR ALL USING (auth.uid() = user_id);
      `

      alert(`Execute este SQL no editor SQL do Supabase:\n\n${sql}`)
      
      // Recarregar status após criar tabelas
      setTimeout(checkDatabase, 2000)
      
    } catch (error) {
      console.error('Erro ao criar tabelas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verificação do Banco de Dados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Logado: {dbStatus.user ? '✅ Sim' : '❌ Não'}</p>
            {dbStatus.user && (
              <p className="text-sm text-gray-600">Email: {dbStatus.user.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={checkDatabase} 
              disabled={loading}
              className="w-full"
            >
              🔄 Verificar Banco
            </Button>
            
            <Button 
              onClick={createTables} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              🛠️ Mostrar SQL para Criar Tabelas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status das Tabelas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Status das Tabelas
          </CardTitle>
          <CardDescription>Verificação de existência das tabelas no Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbStatus.tables.map((table) => (
              <Alert key={table.name} variant={table.exists ? "default" : "destructive"}>
                {table.exists ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{table.name}:</strong> {table.exists ? '✅ Existe' : '❌ Não existe'}
                  {table.error && <span className="block text-xs mt-1">Erro: {table.error}</span>}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status do RLS */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Row Level Security (RLS)
          </CardTitle>
          <CardDescription>Verificação das políticas de segurança</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbStatus.rls.map((rls) => (
              <Alert key={rls.table} variant={rls.enabled ? "default" : "destructive"}>
                {rls.enabled ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{rls.table}:</strong> {rls.enabled ? '✅ RLS Ativo' : '❌ RLS Inativo'}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">1. Se as tabelas não existem:</h4>
              <p className="text-sm text-gray-600">
                Clique em "Mostrar SQL para Criar Tabelas" e execute o código no editor SQL do Supabase
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">2. Se o RLS não está ativo:</h4>
              <p className="text-sm text-gray-600">
                Execute o SQL para habilitar RLS e criar as políticas de segurança
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">3. Após configurar:</h4>
              <p className="text-sm text-gray-600">
                Vá para <code>/test-data</code> para testar o envio de dados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 