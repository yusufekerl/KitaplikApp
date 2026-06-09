import { contextBridge, ipcRenderer } from 'electron'

const invoke = <T>(channel: string, ...args: unknown[]) =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>

contextBridge.exposeInMainWorld('electronAPI', {
  books: {
    getAll:  (filters?: unknown) => invoke('books:getAll', filters),
    getCount:()                  => invoke('books:getCount'),
    getById: (id: number)        => invoke('books:getById', id),
    create:  (data: unknown)     => invoke('books:create', data),
    update:  (id: number, data: unknown) => invoke('books:update', id, data),
    delete:  (id: number)        => invoke('books:delete', id),
  },
  categories: {
    getAll:  ()                          => invoke('categories:getAll'),
    create:  (data: unknown)             => invoke('categories:create', data),
    update:  (id: number, data: unknown) => invoke('categories:update', id, data),
    delete:  (id: number)                => invoke('categories:delete', id),
  },
  authors: {
    getAll: () => invoke('authors:getAll'),
  },
  translators: {
    getAll: () => invoke('translators:getAll'),
  },
  publishers: {
    getAll: () => invoke('publishers:getAll'),
  },
  genres: {
    getAll: () => invoke('genres:getAll'),
  },
  readingQueue: {
    getAll:   ()                     => invoke('queue:getAll'),
    add:      (bookId: number)       => invoke('queue:add', bookId),
    remove:   (bookId: number)       => invoke('queue:remove', bookId),
    reorder:  (ids: number[])        => invoke('queue:reorder', ids),
  },
  stats: {
    get:     (year: number)               => invoke('stats:get', year),
    getGoal: (year: number)               => invoke('stats:getGoal', year),
    setGoal: (year: number, goal: number) => invoke('stats:setGoal', year, goal),
  },
  export: {
    toExcel: () => invoke('export:excel'),
    backup:  () => invoke('backup:save'),
  },
})
