import { useState, useEffect, useCallback } from 'react'
import type { ReadingQueueItem } from '../types'
import { queueApi } from '../lib/window'

export function useReadingQueue() {
  const [queue, setQueue] = useState<ReadingQueueItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await queueApi().getAll()
    if (result.ok) setQueue(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (bookId: number) => {
    await queueApi().add(bookId)
    await fetch()
  }

  const remove = async (bookId: number) => {
    await queueApi().remove(bookId)
    await fetch()
  }

  const reorder = async (ids: number[]) => {
    setQueue((prev) =>
      ids.map((bid, i) => ({ ...prev.find((q) => q.book_id === bid)!, position: i + 1 }))
    )
    await queueApi().reorder(ids)
  }

  return { queue, loading, add, remove, reorder, refresh: fetch }
}
