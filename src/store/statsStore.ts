import { create } from 'zustand'
import type { Stats } from '../types'
import { statsApi } from '../lib/window'

interface StatsStore {
  stats: Stats | null
  yearlyGoal: number | null
  year: number
  loading: boolean
  fetchStats: () => Promise<void>
  fetchGoal: () => Promise<void>
  setGoal: (goal: number) => Promise<void>
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: null,
  yearlyGoal: null,
  year: new Date().getFullYear(),
  loading: false,

  fetchStats: async () => {
    set({ loading: true })
    const result = await statsApi().get(get().year)
    if (result.ok) set({ stats: result.data })
    set({ loading: false })
  },

  fetchGoal: async () => {
    const result = await statsApi().getGoal(get().year)
    if (result.ok) set({ yearlyGoal: result.data })
  },

  setGoal: async (goal: number) => {
    const result = await statsApi().setGoal(get().year, goal)
    if (result.ok) set({ yearlyGoal: goal })
  },
}))
