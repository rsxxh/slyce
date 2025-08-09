const { ipcRenderer } = require('electron')
const windowX = (() => {
  const arg = process.argv.find(a => a.startsWith('--windowX='));
  return arg ? parseInt(arg.split('=')[1], 10) : 0;
})();
const windowY = (() => {
  const arg = process.argv.find(a => a.startsWith('--windowY='));
  return arg ? parseInt(arg.split('=')[1], 10) : 0;
})();

let isSelecting = false
let startX = 0
let startY = 0
let currentX = 0
let currentY = 0

const selectionArea = document.getElementById('selectionArea')
const selectionInfo = document.getElementById('selectionInfo')
const debugInfo = document.getElementById('debugInfo')

function updateDebugInfo() {
    debugInfo.innerHTML = `
        Status: ${isSelecting ? 'Selecting' : 'Ready'}<br>
        Mouse: (${currentX}, ${currentY})<br>
        Start: (${startX}, ${startY})<br>
        Selection: ${isSelecting ? `${Math.abs(currentX - startX)} × ${Math.abs(currentY - startY)}` : 'None'}
    `
}

function handleMouseDown(e) {
    isSelecting = true
    startX = e.clientX
    startY = e.clientY
    currentX = e.clientX
    currentY = e.clientY
    selectionArea.style.display = 'block'
    selectionInfo.style.display = 'block'
    updateSelection()
    updateDebugInfo()
    document.body.style.cursor = 'crosshair'
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseMove(e) {
    currentX = e.clientX
    currentY = e.clientY
    if (isSelecting) {
        updateSelection()
    }
    document.body.style.cursor = 'crosshair'
    updateDebugInfo()
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseUp(e) {
    if (!isSelecting) return
    isSelecting = false
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    if (width < 10 || height < 10) {
        cancelSelection()
        return
    }
    const selection = {
        x: Math.min(startX, currentX) + windowX,
        y: Math.min(startY, currentY) + windowY,
        width: width,
        height: height,
        windowBounds: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
    ipcRenderer.send('area-selected', selection)
    e.preventDefault()
    e.stopPropagation()
    return false
}

function updateSelection() {
    const x = Math.min(startX, currentX)
    const y = Math.min(startY, currentY)
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    selectionArea.style.left = x + 'px'
    selectionArea.style.top = y + 'px'
    selectionArea.style.width = width + 'px'
    selectionArea.style.height = height + 'px'
    selectionInfo.textContent = `${width} × ${height}`
    selectionInfo.style.left = (currentX + 10) + 'px'
    selectionInfo.style.top = (currentY - 25) + 'px'
    if (currentX + 10 + selectionInfo.offsetWidth > window.innerWidth) {
        selectionInfo.style.left = (currentX - selectionInfo.offsetWidth - 10) + 'px'
    }
    if (currentY - 25 < 0) {
        selectionInfo.style.top = (currentY + 10) + 'px'
    }
}

function cancelSelection() {
    isSelecting = false
    selectionArea.style.display = 'none'
    selectionInfo.style.display = 'none'
    document.body.style.cursor = 'crosshair'
    updateDebugInfo()
    ipcRenderer.send('selection-cancelled')
}

document.addEventListener('mousedown', handleMouseDown, true)
document.addEventListener('mousemove', handleMouseMove, true)
document.addEventListener('mouseup', handleMouseUp, true)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelSelection()
    }
})
document.addEventListener('click', (e) => {
    if (!isSelecting) {
        cancelSelection()
    }
})
window.addEventListener('DOMContentLoaded', () => {
    document.body.focus()
    document.body.style.cursor = 'crosshair'
    updateDebugInfo()
})
document.addEventListener('mouseenter', () => {})
document.addEventListener('mouseleave', () => {}) 