import { useEffect } from 'react'
import { useBookStore } from '../store/bookStore'

export function useBooks() {
  const store = useBookStore()

  useEffect(() => {
    store.fetchBooks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return store
}
