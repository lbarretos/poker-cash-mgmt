import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Player {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
}

export interface Session {
  id: string
  name: string
  status: "active" | "completed"
  createdAt: string
  completedAt?: string
  tableCount: number
  notes?: string
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
}

export interface ChipType {
  id: string
  color: string
  value: number
  count: number
}

export interface PokerStore {
  sessions: Session[]
  players: Player[]
  transactions: Transaction[]
  chips: ChipType[]

  // Session actions
  addSession: (session: Omit<Session, "id" | "createdAt">) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  deleteSession: (id: string) => void

  // Player actions
  addPlayer: (player: Omit<Player, "id" | "createdAt">) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  deletePlayer: (id: string) => void

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  // Chip actions
  addChipType: (chip: Omit<ChipType, "id">) => void
  updateChipType: (id: string, updates: Partial<ChipType>) => void
  deleteChipType: (id: string) => void
  updateChipCount: (id: string, count: number) => void
}

export const usePokerStore = create<PokerStore>()(
  persist(
    (set, get) => ({
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

      addSession: (session) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              ...session,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((session) => (session.id === id ? { ...session, ...updates } : session)),
        })),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.sessionId !== id),
        })),

      addPlayer: (player) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              ...player,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((player) => (player.id === id ? { ...player, ...updates } : player)),
        })),

      deletePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
          transactions: state.transactions.filter((transaction) => transaction.playerId !== id),
        })),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...transaction,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        })),

      addChipType: (chip) =>
        set((state) => ({
          chips: [
            ...state.chips,
            {
              ...chip,
              id: crypto.randomUUID(),
            },
          ],
        })),

      updateChipType: (id, updates) =>
        set((state) => ({
          chips: state.chips.map((chip) => (chip.id === id ? { ...chip, ...updates } : chip)),
        })),

      deleteChipType: (id) =>
        set((state) => ({
          chips: state.chips.filter((chip) => chip.id !== id),
        })),

      updateChipCount: (id, count) =>
        set((state) => ({
          chips: state.chips.map((chip) => (chip.id === id ? { ...chip, count } : chip)),
        })),
    }),
    {
      name: "poker-cash-manager-storage",
    },
  ),
)
