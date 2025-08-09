
const { app, BrowserWindow, Tray, Menu, clipboard, globalShortcut, dialog, nativeImage, ipcMain, Notification } = require('electron/main')
const path = require('path')
const screenshot = require('screenshot-desktop')
const fs = require('fs')
const os = require('os')


let tray = null
let mainWindow = null
let selectionWindow = null
let isProcessing = false


const createTrayIcon = () => {
  try {
    const canvas = require('canvas').createCanvas(20, 20)
    const ctx = canvas.getContext('2d')
    
   
    ctx.clearRect(0, 0, 20, 20)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(4, 4, 12, 12)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(6, 8, 8, 1)
    ctx.fillRect(6, 10, 8, 1)
    ctx.fillRect(6, 12, 6, 1)
    
    return nativeImage.createFromBuffer(canvas.toBuffer())
  } catch (error) {
    console.log('Canvas failed, using fallback icon:', error.message)
    return null
  }
}

const createTray = () => {
  let icon
  try {
    icon = createTrayIcon()
    if (!icon) {
      icon = nativeImage.createFromPath(path.join(__dirname, 'icon-white.png')).resize({ width: 16, height: 16 })
    }
  } catch (error) {
    console.log('Using fallback icon due to error:', error.message)
    icon = nativeImage.createFromPath(path.join(__dirname, 'icon-white.png')).resize({ width: 16, height: 16 })
  }
  
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Capture Area & Extract Text',
      click: () => takeScreenshotSlyce()
    },
    { type: 'separator' },
    {
      label: 'View Last Extracted Text',
      click: () => showLastText()
    },
    {
      label: 'Settings',
      click: () => createSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Slyce Screenshot Tool - Press Ctrl+Shift+O to select area and extract text')
  
  tray.on('double-click', () => {
    takeScreenshotSlyce()
  })
}

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon-white.png'),
    skipTaskbar: true
  })
  
  mainWindow.loadFile('result.html')
  
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

const createSettingsWindow = () => {
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    modal: false,
    show: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    icon: path.join(__dirname, 'icon-white.png')
  })
  
  settingsWindow.loadFile('settings.html')
  
  // settingsWindow.on('closed', () => {
  //   if (mainWindow && mainWindow.isVisible()) {
  //     mainWindow.hide()
  //   }
  // })
}

const createSelectionWindow = () => {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workArea
  
  selectionWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    show: false,
    icon: path.join(__dirname, 'icon-white.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [`--windowX=${workArea.x}`, `--windowY=${workArea.y}`]
    }
  })
  
  selectionWindow.loadFile('selection.html')
  
  selectionWindow.once('ready-to-show', () => {
    selectionWindow.setAlwaysOnTop(true, 'screen-saver')
    selectionWindow.setIgnoreMouseEvents(false)
    selectionWindow.show()
    selectionWindow.focus()
    
    setTimeout(() => {
      if (selectionWindow && !selectionWindow.isDestroyed()) {
        selectionWindow.focus()
        selectionWindow.setIgnoreMouseEvents(false)
      }
    }, 100)
  })
  
  selectionWindow.on('closed', () => {
    selectionWindow = null
  })
}

let lastExtractedText = ''

const takeScreenshotSlyce = async () => {
  if (isProcessing) {
    showNotification('Slyce in progress...', 'Please wait for the current operation to complete.')
    return
  }
  
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide()
  }
  
  setTimeout(() => {
    createSelectionWindow()
  }, 200)
}

const captureSelectedArea = async (selection) => {
  if (isProcessing) return
  
  isProcessing = true
  showNotification('Capturing Selection...', 'Processing selected area with Slyce')
  
  try {
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const scaleFactor = primaryDisplay.scaleFactor
    const bounds = primaryDisplay.bounds
    const workArea = primaryDisplay.workArea

    if (selectionWindow) {
      selectionWindow.close()
      selectionWindow = null
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const fullScreenshot = await screenshot({ format: 'png' })
    const sharp = require('sharp')

    const screenshotMetadata = await sharp(fullScreenshot).metadata()
    const menuBarHeight = (bounds.height - workArea.height) * scaleFactor
    const effectiveWorkArea = {
      width: workArea.width * scaleFactor,
      height: workArea.height * scaleFactor,
      x: workArea.x * scaleFactor,
      y: workArea.y * scaleFactor
    }
    const adjustedSelection = {
      left: Math.round(selection.x * scaleFactor),
      top: Math.round(selection.y * scaleFactor),
      width: Math.round(selection.width * scaleFactor),
      height: Math.round(selection.height * scaleFactor)
    }
    adjustedSelection.left = Math.max(0, Math.min(adjustedSelection.left, screenshotMetadata.width - adjustedSelection.width))
    adjustedSelection.top = Math.max(0, Math.min(adjustedSelection.top, screenshotMetadata.height - adjustedSelection.height))
    adjustedSelection.width = Math.min(adjustedSelection.width, screenshotMetadata.width - adjustedSelection.left)
    adjustedSelection.height = Math.min(adjustedSelection.height, screenshotMetadata.height - adjustedSelection.top)

    const croppedBuffer = await sharp(fullScreenshot)
      .extract(adjustedSelection)
      .png()
      .toBuffer()
    showNotification('Processing Slyce...', 'Extracting text from selected area')
    const extractedText = await processImageWithSlyce(croppedBuffer)
    if (extractedText && extractedText.trim()) {
      lastExtractedText = extractedText.trim()
      clipboard.writeText(lastExtractedText)
      showNotification('Text Copied!', `Extracted and copied: "${lastExtractedText.substring(0, 50)}${lastExtractedText.length > 50 ? '...' : ''}"`)
      updateResultWindow(lastExtractedText)
    } else {
      showNotification('No Text Found', 'No readable text detected in the selected area')
    }
  } catch (error) {
    showNotification('Error', 'Failed to process selected area. Please try again.')
  } finally {
    isProcessing = false
  }
}

const processImageWithSlyce = async (imageBuffer) => {
  const Tesseract = require('tesseract.js')
  try {
    const cachePath = path.join(app.getPath('userData'), 'tesseract-cache')
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true })
    }

    const langPath = (() => {
      const candidates = [
        path.join(process.resourcesPath || __dirname, 'tessdata'),
        path.join(process.resourcesPath || __dirname, 'app.asar.unpacked', 'tessdata'),
        __dirname
      ]
      
      for (const candidate of candidates) {
        const trainedDataPath = path.join(candidate, 'eng.traineddata')
        const trainedDataGzPath = path.join(candidate, 'eng.traineddata.gz')
        if (fs.existsSync(trainedDataPath) || fs.existsSync(trainedDataGzPath)) {
          return candidate
        }
      }
      
      return __dirname
    })()

    const worker = await Tesseract.createWorker('eng', 1, {
      langPath: langPath,
      cachePath: cachePath,
      logger: m => {}
    })
    
    const { data: { text } } = await worker.recognize(imageBuffer)
    await worker.terminate()
    return text
  } catch (error) {
    throw error
  }
}

const showNotification = (title, body) => {
  if (process.platform === 'darwin') {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title,
        body: body,
        silent: false,
        timeoutType: 'default'
      })
      
      notification.show()
      
      setTimeout(() => {
        notification.close()
      }, 3000)
    }
  } else {
    tray.displayBalloon({
      title: title,
      content: body,
      timeout: 3000
    })
  }
}

const showLastText = () => {
  if (!lastExtractedText) {
    showNotification('No Text Available', 'No text has been extracted yet. Take a screenshot first!')
    return
  }
  
  if (!mainWindow) {
    createMainWindow()
  }
  
  updateResultWindow(lastExtractedText)
  mainWindow.show()
  mainWindow.focus()
}

const updateResultWindow = (text) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-text', text)
  }
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    try { app.setAppUserModelId('com.example.slyce') } catch (_) {}
  }

  if (process.platform === 'darwin') {
    if (Notification.isSupported()) {
      try {
        const permission = await Notification.requestPermission()
      } catch (error) {
      }
    }
  }

  createTray()
  
  if (process.platform === 'win32') {
    const applicationMenu = Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: 'Capture Area & Extract Text',
            accelerator: 'CommandOrControl+Shift+O',
            click: () => takeScreenshotSlyce()
          },
          { type: 'separator' },
          {
            label: 'View Last Extracted Text',
            accelerator: 'CommandOrControl+L',
            click: () => showLastText()
          },
          {
            label: 'Settings',
            accelerator: 'CommandOrControl+,',
            click: () => createSettingsWindow()
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: 'Alt+F4',
            click: () => {
              app.isQuiting = true
              app.quit()
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Slyce',
            click: () => {
              dialog.showMessageBox({
                type: 'info',
                title: 'About Slyce',
                message: 'Slyce v1.0.0',
                detail: 'A cross-platform screenshot tool with OCR text extraction.\n\nPress Ctrl+Shift+O to capture and extract text from any area of your screen.'
              })
            }
          }
        ]
      }
    ])
    Menu.setApplicationMenu(applicationMenu)
  } else {
    Menu.setApplicationMenu(null)
  }
  
  createMainWindow()
  
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    takeScreenshotSlyce()
  })
  
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    showLastText()
  })
  
  app.on('activate', () => {
  })
  
  showNotification('Slyce Tool Ready!', 'Press Ctrl+Shift+O to select area and extract text from screen')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
  }
})

app.on('before-quit', () => {
  app.isQuiting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.on('take-screenshot', () => {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide()
  }
  takeScreenshotSlyce()
})

ipcMain.on('area-selected', (event, selection) => {
  captureSelectedArea(selection)
})

ipcMain.on('selection-cancelled', () => {
  if (selectionWindow) {
    selectionWindow.close()
    selectionWindow = null
  }
  isProcessing = false
})

ipcMain.on('settings-updated', (event, settings) => {
})

ipcMain.on('get-last-text', (event) => {
  event.reply('last-text-response', lastExtractedText)
})