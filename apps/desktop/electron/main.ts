import { app, BrowserWindow } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// `require` is intentionally unused in ESM build; keep the import available for potential use but
// comment out the assignment to avoid TypeScript TS6133 (variable declared but its value is never read).
// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let deeplinkingUrl: string | null = null
const PROTOCOL = 'myapp'

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    if (deeplinkingUrl) {
      win?.webContents.send('deep-link', deeplinkingUrl)
      deeplinkingUrl = null
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// macOS: handle opening the app via custom protocol while app is running
app.on('open-url', (event, url) => {
  event.preventDefault()
  // store and forward to renderer when ready
  deeplinkingUrl = url
  if (win?.webContents) {
    win.webContents.send('deep-link', url)
  }
})

// Ensure single instance and handle second-instance protocol URLs (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
    const url = argv.find(a => a && a.toString().startsWith(`${PROTOCOL}://`))
    if (url) handleDeepLink(url.toString())
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function handleDeepLink(url: string) {
  deeplinkingUrl = url
  if (win?.webContents) {
    win.webContents.send('deep-link', url)
  }
}

// Try to register protocol handler and process any startup URL
app.whenReady().then(() => {
  try {
    if (app.isPackaged) {
      app.setAsDefaultProtocolClient(PROTOCOL)
    } else {
      // In development, registering protocol may require explicit exec args
      try {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1] ?? '')])
      } catch (e) {
        // ignore registration errors in dev
      }
    }
  } catch (e) {
    // ignore
  }

  // If the app was launched with a deep link, capture it
  const startupUrl = process.argv.find(a => a && a.toString().startsWith(`${PROTOCOL}://`))
  if (startupUrl) {
    deeplinkingUrl = startupUrl.toString()
  }

  createWindow()
})
