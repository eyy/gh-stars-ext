/* global browser */

const $ = document.querySelector.bind(document)

function saveOptions (e) {
  browser.storage.sync.set({
    user: $('#user').value
  })
  e.preventDefault()
}

function restoreOptions () {
  browser.storage.sync.get('user').then(res => {
    $('#user').value = res.user || ''
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
$('form').addEventListener('submit', saveOptions)
