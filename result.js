const { ipcRenderer } = require('electron')
const { clipboard } = require('electron')

const emptyState = document.getElementById('emptyState')
const textAreaWrapper = document.getElementById('textAreaWrapper')
const textArea = document.getElementById('textArea')

window.addEventListener('DOMContentLoaded', () => {
    loadLastExtractedText()
})

ipcRenderer.on('update-text', (event, text) => {
    updateDisplay(text)
})

function loadLastExtractedText() {
    const lastText = localStorage.getItem('lastExtractedText')
    if (lastText && lastText.trim()) {
        updateDisplay(lastText)
    } else {
        ipcRenderer.send('get-last-text')
    }
}

ipcRenderer.on('last-text-response', (event, text) => {
    if (text && text.trim()) {
        updateDisplay(text)
    }
})

function updateDisplay(text) {
    if (text && text.trim()) {
        emptyState.style.display = 'none'
        textAreaWrapper.style.display = 'flex'
        textArea.value = text
        localStorage.setItem('lastExtractedText', text)
    } else {
        showEmptyState()
    }
}

function showEmptyState() {
    emptyState.style.display = 'flex'
    textAreaWrapper.style.display = 'none'
    textArea.value = ''
}

function editText() {
    const isReadOnly = textArea.readOnly
    textArea.readOnly = !isReadOnly
    
    const editBtn = document.querySelector('.edit-btn')
    if (isReadOnly) {
        textArea.focus()
        textArea.select()
        editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
        editBtn.title = 'Save'
        editBtn.style.background = 'rgba(101, 208, 234, 0.8)'
    } else {
        editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'
        editBtn.title = 'Edit'
        editBtn.style.background = 'rgba(0, 0, 0, 0.7)'
        localStorage.setItem('lastExtractedText', textArea.value)
    }
}

function copyToClipboard(event) {
    const text = textArea.value
    if (text) {
        try {
            clipboard.writeText(text)
            const btn = event && event.target ? event.target : document.activeElement
            const originalText = btn.innerHTML
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
            btn.style.background = 'rgba(101, 208, 234, 0.8)'
            
            textArea.select()
            textArea.setSelectionRange(0, 99999)
            
            setTimeout(() => {
                btn.innerHTML = originalText
                btn.style.background = 'rgba(0, 0, 0, 0.7)'
            }, 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
            const btn = event && event.target ? event.target : document.activeElement
            const originalText = btn.innerHTML
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
            btn.style.background = '#dc3545'
            setTimeout(() => {
                btn.innerHTML = originalText
                btn.style.background = 'rgba(0, 0, 0, 0.7)'
            }, 2000)
        }
    }
}

function clearText() {
    showEmptyState()
    localStorage.removeItem('lastExtractedText')
}

function triggerScreenshot() {
    ipcRenderer.send('take-screenshot')
}

window.addEventListener('focus', () => {
    textArea.focus()
}) 