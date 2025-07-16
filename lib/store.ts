import { create } from "zustand"
import { supabase } from "./supabase"

export interface Player {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
  user_id?: string
}

export interface Session {
  id: string
  name: string
  status: "active" | "completed"
  created_at: string
  start_time?: string
  end_time?: string
  tableCount?: number // This field doesn't exist in DB, keeping for UI compatibility
  notes?: string
  user_id?: string
}

export interface Transaction {
  id: string
  session_id: string
  player_id: string
  type: "buy-in" | "cash-out" | "payment"
  amount: number
  created_at: string
  description?: string
  notes?: string
  tableNumber?: number // UI only field
  user_id?: string
}

export interface ChipType {
  id: string
  name?: string
  color: string
  value: number
  count?: number // UI only field, not in DB
  user_id?: string
  created_at?: string
}

export interface PokerStore {
  sessions: Session[]
  players: Player[]
  transactions: Transaction[]
  chips: ChipType[]

  // Session actions
  addSession: (session: Omit<Session, "id" | "created_at" | "user_id">) => Promise<void>
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  // Player actions
  addPlayer: (player: Omit<Player, "id" | "created_at" | "user_id">) => Promise<void>
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, "id" | "created_at" | "user_id">) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  // Chip actions
  addChipType: (chip: Omit<ChipType, "id" | "user_id" | "created_at">) => Promise<void>
  updateChipType: (id: string, updates: Partial<ChipType>) => Promise<void>
  deleteChipType: (id: string) => Promise<void>
  updateChipCount: (id: string, count: number) => Promise<void>

  // Data loading
  loadData: () => Promise<void>
}

export const usePokerStore = create<PokerStore>()((set, get) => ({
  sessions: [],
  players: [],
  transactions: [],
  chips: [
    { id: "1", color: "white", value: 1, count: 100 },
    { id: "2", color: "red", value: 5, count: 100 },
    { id: "3", color: "green", value: 25, count: 50 },
    { id: "4", color: "black", value: 100, count: 25 },
    { id: "5", color: "purple", value: 500, count: 10 },
  ],

  // Carregar dados do Supabase
  loadData: async () => {
    try {
      console.log('🔄 Carregando dados do Supabase...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ Usuário não encontrado')
        return
      }

      // Carregar sessões
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (sessionsError) {
        console.error('❌ Erro ao carregar sessões:', sessionsError)
      } else {
        console.log(`✅ ${sessions?.length || 0} sessões carregadas`)
      }

      // Carregar jogadores
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (playersError) {
        console.error('❌ Erro ao carregar jogadores:', playersError)
      } else {
        console.log(`✅ ${players?.length || 0} jogadores carregados`)
      }

      // Carregar transações
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.error('❌ Erro ao carregar transações:', transactionsError)
      } else {
        console.log(`✅ ${transactions?.length || 0} transações carregadas`)
      }

      // Carregar chips
      const { data: chips, error: chipsError } = await supabase
        .from('chip_types')
        .select('*')
        .eq('user_id', user.id)

      if (chipsError) {
        console.error('❌ Erro ao carregar tipos de fichas:', chipsError)
      } else {
        console.log(`✅ ${chips?.length || 0} tipos de fichas carregados`)
      }

      set({
        sessions: sessions || [],
        players: players || [],
        transactions: transactions || [],
        chips: chips?.length ? chips : get().chips
      })
      
      console.log('✅ Dados carregados com sucesso!')
    } catch (error) {
      console.error('💥 Erro ao carregar dados:', error)
    }
  },

  addSession: async (session) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newSession = {
        name: session.name,
        status: session.status,
        user_id: user.id
      }

      console.log('➕ Criando sessão:', newSession)
      
      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()

      if (!error && data) {
        console.log('✅ Sessão criada no banco:', data[0])
        set((state) => ({
          sessions: [data[0], ...state.sessions]
        }))
      } else {
        console.error('❌ Erro ao criar sessão:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao adicionar sessão:', error)
    }
  },

  updateSession: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove campos que não existem no DB
      const dbUpdates = { ...updates }
      delete dbUpdates.tableCount
      
      // Mapear campos para o formato do DB
      if (updates.status === 'completed' && !dbUpdates.end_time) {
        dbUpdates.end_time = new Date().toISOString()
      }

      console.log('✏️ Atualizando sessão:', id, dbUpdates)

      const { error } = await supabase
        .from('sessions')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Sessão atualizada no banco')
        set((state) => ({
          sessions: state.sessions.map((session) => 
            session.id === id ? { ...session, ...updates } : session
          ),
        }))
      } else {
        console.error('❌ Erro ao atualizar sessão:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao atualizar sessão:', error)
    }
  },

  deleteSession: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🗑️ Deletando sessão:', id)

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Sessão deletada do banco')
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.session_id !== id),
        }))
      } else {
        console.error('❌ Erro ao deletar sessão:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao deletar sessão:', error)
    }
  },

  addPlayer: async (player) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newPlayer = {
        name: player.name,
        email: player.email,
        phone: player.phone,
        user_id: user.id
      }

      console.log('➕ Criando jogador:', newPlayer)

      const { data, error } = await supabase
        .from('players')
        .insert([newPlayer])
        .select()

      if (!error && data) {
        console.log('✅ Jogador criado no banco:', data[0])
        set((state) => ({
          players: [data[0], ...state.players]
        }))
      } else {
        console.error('❌ Erro ao criar jogador:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao adicionar jogador:', error)
    }
  },

  updatePlayer: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('✏️ Atualizando jogador:', id, updates)

      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Jogador atualizado no banco')
        set((state) => ({
          players: state.players.map((player) => 
            player.id === id ? { ...player, ...updates } : player
          ),
        }))
      } else {
        console.error('❌ Erro ao atualizar jogador:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao atualizar jogador:', error)
    }
  },

  deletePlayer: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🗑️ Deletando jogador:', id)

      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Jogador deletado do banco')
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.player_id !== id),
        }))
      } else {
        console.error('❌ Erro ao deletar jogador:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao deletar jogador:', error)
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newTransaction = {
        session_id: transaction.session_id,
        player_id: transaction.player_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.notes || transaction.description,
        user_id: user.id
      }

      console.log('➕ Criando transação:', newTransaction)

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()

      if (!error && data) {
        console.log('✅ Transação criada no banco:', data[0])
        set((state) => ({
          transactions: [data[0], ...state.transactions]
        }))
      } else {
        console.error('❌ Erro ao criar transação:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao adicionar transação:', error)
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mapear campos da UI para o DB
      const dbUpdates = { ...updates }
      if (dbUpdates.notes) {
        dbUpdates.description = dbUpdates.notes
        delete dbUpdates.notes
      }
      delete dbUpdates.tableNumber // Campo só da UI

      console.log('✏️ Atualizando transação:', id, dbUpdates)

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Transação atualizada no banco')
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          ),
        }))
      } else {
        console.error('❌ Erro ao atualizar transação:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao atualizar transação:', error)
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🗑️ Deletando transação:', id)

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Transação deletada do banco')
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }))
      } else {
        console.error('❌ Erro ao deletar transação:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao deletar transação:', error)
    }
  },

  addChipType: async (chip) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newChip = {
        name: chip.name || `Ficha ${chip.color}`,
        color: chip.color,
        value: chip.value,
        user_id: user.id
      }

      console.log('➕ Criando tipo de ficha:', newChip)

      const { data, error } = await supabase
        .from('chip_types')
        .insert([newChip])
        .select()

      if (!error && data) {
        console.log('✅ Tipo de ficha criado no banco:', data[0])
        // Adicionar count para compatibilidade com UI
        const chipWithCount = { ...data[0], count: chip.count || 0 }
        set((state) => ({
          chips: [...state.chips, chipWithCount]
        }))
      } else {
        console.error('❌ Erro ao criar tipo de ficha:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao adicionar tipo de ficha:', error)
    }
  },

  updateChipType: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove count pois não existe no DB
      const dbUpdates = { ...updates }
      delete dbUpdates.count

      console.log('✏️ Atualizando tipo de ficha:', id, dbUpdates)

      const { error } = await supabase
        .from('chip_types')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Tipo de ficha atualizado no banco')
        set((state) => ({
          chips: state.chips.map((chip) => 
            chip.id === id ? { ...chip, ...updates } : chip
          ),
        }))
      } else {
        console.error('❌ Erro ao atualizar tipo de ficha:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao atualizar tipo de ficha:', error)
    }
  },

  deleteChipType: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🗑️ Deletando tipo de ficha:', id)

      const { error } = await supabase
        .from('chip_types')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        console.log('✅ Tipo de ficha deletado do banco')
        set((state) => ({
          chips: state.chips.filter((chip) => chip.id !== id),
        }))
      } else {
        console.error('❌ Erro ao deletar tipo de ficha:', error)
      }
    } catch (error) {
      console.error('💥 Erro ao deletar tipo de ficha:', error)
    }
  },

  updateChipCount: async (id, count) => {
    // Count não existe no DB, só atualiza localmente para compatibilidade com UI
    console.log('📊 Atualizando count de ficha (local):', id, count)
    set((state) => ({
      chips: state.chips.map((chip) => 
        chip.id === id ? { ...chip, count } : chip
      ),
    }))
  },
}))
