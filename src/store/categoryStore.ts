import { create } from 'zustand'
import type { Category } from '../types'
import { categoriesApi } from '../lib/window'

interface CategoryStore {
  categories: Category[]
  fetchCategories: () => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],

  fetchCategories: async () => {
    const result = await categoriesApi().getAll()
    if (result.ok) set({ categories: result.data })
  },
}))
