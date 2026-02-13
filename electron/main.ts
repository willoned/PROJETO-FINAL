import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// BYTENODE SECURITY:
// Ensure Bytenode is initialized if we are loading compiled code.
// require('bytenode'); 

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 768,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.ico'), 
    autoHideMenuBar: true,
    // EXTREME SECURITY: REMOVE MENU BAR
    frame: true, // Keep frame but remove default menus
    kiosk: false, // Set true if you want full lockdown
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false, 
      webSecurity: false, 
      devTools: false // DISABLE DEVTOOLS BY DEFAULT
    },
  })

  // SECURITY: REMOVE MENU BAR
  win.setMenu(null);

  // SECURITY: BLOCK DEVTOOLS SHORTCUTS
  // This prevents F12, Ctrl+Shift+I from opening inspection
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
    }
    if (input.key === 'F12') {
        event.preventDefault();
    }
    if (input.control && input.key.toLowerCase() === 'r') {
        // Optional: Block Reload
        event.preventDefault();
    }
  });

  win.webContents.session.clearCache().then(() => {
    console.log('Secure Session Started');
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Only allow devtools in development mode
    win.webContents.openDevTools(); 
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Global Shortcuts for extra security (System Level)
app.whenReady().then(() => {
    createWindow();
    
    // Register global shortcuts to intercept specific key combinations
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        // Do nothing (Block DevTools)
        console.log('DevTools Blocked');
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})