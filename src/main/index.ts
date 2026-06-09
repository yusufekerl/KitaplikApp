import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb } from '../../electron/db/connection'
import { registerBooksHandlers } from '../../electron/ipc/books'
import { registerCategoriesHandlers } from '../../electron/ipc/categories'
import { registerLookupsHandlers } from '../../electron/ipc/lookups'
import { registerReadingQueueHandlers } from '../../electron/ipc/readingQueue'
import { registerStatsHandlers } from '../../electron/ipc/stats'
import { registerExportBackupHandlers } from '../../electron/ipc/exportBackup'

let win: BrowserWindow | null

const iconPath = app.isPackaged
  ? join(process.resourcesPath, 'icon.ico')
  : join(__dirname, '..', '..', 'build', 'icon.ico')

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#f9fafb',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  win.once('ready-to-show', () => {
    win?.show()
    win?.setTitle(`KitaplıkApp v${app.getVersion()}`)
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const db = await getDb()
  registerBooksHandlers(db)
  registerCategoriesHandlers(db)
  registerLookupsHandlers(db)
  registerReadingQueueHandlers(db)
  registerStatsHandlers(db)
  registerExportBackupHandlers(db)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})
