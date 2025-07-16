import { create } from "zustand"
import { supabase } from "./supabase"

export interface Player {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
  user_id?: string
}

export interface Session {
  id: string
  name: string
  status: "active" | "completed"
  createdAt: string
  completedAt?: string
  tableCount: number
  notes?: string
  user_id?: string
}

export interface Transaction {
  id: string
  sessionId: string
  playerId: string
  type: "buy-in" | "cash-out" | "payment"
  amount: number
  timestamp: string
  notes?: string
  tableNumber?: number
  user_id?: string
}

export interface ChipType {
  id: string
  color: string
  value: number
  count: number
  user_id?: string
}

export interface PokerStore {
  sessions: Session[]
  players: Player[]
  transactions: Transaction[]
  chips: ChipType[]

  // Session actions
  addSession: (session: Omit<Session, "id" | "createdAt" | "user_id">) => Promise<void>
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  // Player actions
  addPlayer: (player: Omit<Player, "id" | "createdAt" | "user_id">) => Promise<void>
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp" | "user_id">) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  // Chip actions
  addChipType: (chip: Omit<ChipType, "id" | "user_id">) => Promise<void>
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Carregar sessões
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)

      // Carregar jogadores
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)

      // Carregar transações
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)

      // Carregar chips
      const { data: chips } = await supabase
        .from('chip_types')
        .select('*')
        .eq('user_id', user.id)

      set({
        sessions: sessions || [],
        players: players || [],
        transactions: transactions || [],
        chips: chips || get().chips
      })
    } catch (error) {
      console.error('Error loading data:', error)
    }
  },

  addSession: async (session) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newSession = {
        ...session,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()

      if (!error && data) {
        set((state) => ({
          sessions: [...state.sessions, data[0]]
        }))
      } else {
        console.error('Error adding session:', error)
      }
    } catch (error) {
      console.error('Error adding session:', error)
    }
  },

  updateSession: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          sessions: state.sessions.map((session) => 
            session.id === id ? { ...session, ...updates } : session
          ),
        }))
      } else {
        console.error('Error updating session:', error)
      }
    } catch (error) {
      console.error('Error updating session:', error)
    }
  },

  deleteSession: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.sessionId !== id),
        }))
      } else {
        console.error('Error deleting session:', error)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  },

  addPlayer: async (player) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newPlayer = {
        ...player,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('players')
        .insert([newPlayer])
        .select()

      if (!error && data) {
        set((state) => ({
          players: [...state.players, data[0]]
        }))
      } else {
        console.error('Error adding player:', error)
      }
    } catch (error) {
      console.error('Error adding player:', error)
    }
  },

  updatePlayer: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          players: state.players.map((player) => 
            player.id === id ? { ...player, ...updates } : player
          ),
        }))
      } else {
        console.error('Error updating player:', error)
      }
    } catch (error) {
      console.error('Error updating player:', error)
    }
  },

  deletePlayer: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.playerId !== id),
        }))
      } else {
        console.error('Error deleting player:', error)
      }
    } catch (error) {
      console.error('Error deleting player:', error)
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newTransaction = {
        ...transaction,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()

      if (!error && data) {
        set((state) => ({
          transactions: [...state.transactions, data[0]]
        }))
      } else {
        console.error('Error adding transaction:', error)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          ),
        }))
      } else {
        console.error('Error updating transaction:', error)
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }))
      } else {
        console.error('Error deleting transaction:', error)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  },

  addChipType: async (chip) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newChip = {
        ...chip,
        id: crypto.randomUUID(),
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('chip_types')
        .insert([newChip])
        .select()

      if (!error && data) {
        set((state) => ({
          chips: [...state.chips, data[0]]
        }))
      } else {
        console.error('Error adding chip type:', error)
      }
    } catch (error) {
      console.error('Error adding chip type:', error)
    }
  },

  updateChipType: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('chip_types')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          chips: state.chips.map((chip) => 
            chip.id === id ? { ...chip, ...updates } : chip
          ),
        }))
      } else {
        console.error('Error updating chip type:', error)
      }
    } catch (error) {
      console.error('Error updating chip type:', error)
    }
  },

  deleteChipType: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('chip_types')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          chips: state.chips.filter((chip) => chip.id !== id),
        }))
      } else {
        console.error('Error deleting chip type:', error)
      }
    } catch (error) {
      console.error('Error deleting chip type:', error)
    }
  },

  updateChipCount: async (id, count) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('chip_types')
        .update({ count })
        .eq('id', id)
        .eq('user_id', user.id)

      if (!error) {
        set((state) => ({
          chips: state.chips.map((chip) => 
            chip.id === id ? { ...chip, count } : chip
          ),
        }))
      } else {
        console.error('Error updating chip count:', error)
      }
    } catch (error) {
      console.error('Error updating chip count:', error)
    }
  },
}))
