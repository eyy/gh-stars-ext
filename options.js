function saveOptions (e) {
  browser.storage.sync.set({
    user: document.querySelector('#user').value
  })
  e.preventDefault()
}

function restoreOptions () {
  browser.storage.sync.get('user').then(res => {
    document.querySelector('#user').value = res.user || ''
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.querySelector('form').addEventListener('submit', saveOptions)
