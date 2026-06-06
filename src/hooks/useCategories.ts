import { useEffect } from 'react'
import { useCategoryStore } from '../store/categoryStore'

export function useCategories() {
  const store = useCategoryStore()

  useEffect(() => {
    store.fetchCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return store
}
