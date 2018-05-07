/* global browser, fetch, Fuse */

const baseUrl = 'https://github.com'
const endpoint = user => `https://api.github.com/users/${user}/starred`

const fuseOpts = {
  shouldSort: true,
  tokenize: true,
  matchAllTokens: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    'name',
    'author.login',
    'description',
    'language'
  ]
}

function mem (fn, expire = 1000) {
  let last
  let res
  return function () {
    const now = +new Date()
    if (res && last && now < last + expire) { return Promise.resolve(res) }

    last = now
    return fn()
      .then(r => {
        res = r
        return r
      })
  }
}

const getStarred = mem(function () {
  return browser.storage.sync.get('user')
    .then(res => {
      if (!res.user) {
        browser.runtime.openOptionsPage()
        return
      }

      return fetch(endpoint(res.user))
        .then(res => res.json())
    })
}, 60 * 1000)

function createSuggestions (text) {
  return projects => new Promise((resolve, reject) => {
    if (!projects || !projects.length) { return reject(new Error('No starred projects.')) }

    const fuse = new Fuse(projects, fuseOpts)
    let suggestions = fuse.search(text)
      .map(p => ({
        content: p.html_url,
        description: p.name + ' - ' + p.description
      }))

    if (suggestions.length) { resolve(suggestions) } else { reject(new Error('No matched starred projects.')) }
  })
}

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
  getStarred()
    .then(createSuggestions(text))
    .then(addSuggestions)
    .catch(err => {
      addSuggestions([{
        content: '',
        description: `Error. ${err ? err.message : ''}`
      }])
      throw err
    })
})

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text
  if (!text) { return }

  if (!text.startsWith(baseUrl)) {
    url = `${baseUrl}/search?q=${text}`
  }
  switch (disposition) {
    case 'currentTab':
      browser.tabs.update({ url })
      break
    case 'newForegroundTab':
      browser.tabs.create({ url })
      break
    case 'newBackgroundTab':
      browser.tabs.create({ url, active: false })
      break
  }
})
