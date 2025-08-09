const { ipcRenderer } = require('electron')

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('slyceSettings') || '{}')
    document.getElementById('notificationToggle').checked = settings.notifications !== false
    document.getElementById('autoCopyToggle').checked = settings.autoCopy !== false
}

function saveSettings() {
    const settings = {
        notifications: document.getElementById('notificationToggle').checked,
        autoCopy: document.getElementById('autoCopyToggle').checked
    }
    localStorage.setItem('slyceSettings', JSON.stringify(settings))
    const status = document.getElementById('status')
    status.textContent = 'Settings saved successfully!'
    status.style.display = 'block'
    setTimeout(() => {
        status.style.display = 'none'
    }, 2000)
    ipcRenderer.send('settings-updated', settings)
}

function resetSettings() {
    localStorage.removeItem('slyceSettings')
    loadSettings()
    const status = document.getElementById('status')
    status.textContent = 'Settings reset to default'
    status.style.display = 'block'
    setTimeout(() => {
        status.style.display = 'none'
    }, 2000)
}


window.addEventListener('DOMContentLoaded', loadSettings)
document.querySelectorAll('input').forEach(element => {
    element.addEventListener('change', () => {
        setTimeout(saveSettings, 500)
    })
})