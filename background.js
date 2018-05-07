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

const getStars = _.throttle(function () {
  console.log('getStars')
  return browser.storage.sync.get('user')
    .then(res => {
      console.log('user', res.user)

      if (!res.user) {
        return browser.runtime.openOptionsPage()
      }

      return fetch(endpoint(res.user))
        .then(res => res.json())
    })
}, 60 * 1000)

function createSuggestions (text) {
  return projects => new Promise((resolve, reject) => {
    if (!projects || !projects.length) { return reject() }

    const fuse = new Fuse(projects, fuseOpts)
    let suggestions = fuse.search(text)
      .map(p => ({
        content: p.html_url,
        description: p.name + ' - ' + p.description
      }))

    if (suggestions.length) { resolve(suggestions) } else { reject() }
  })
}

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
  getStars()
    .then(createSuggestions(text))
    .then(addSuggestions)
    .catch(err => {
      addSuggestions([{
        content: '',
        description: `:( Error: ${err.message}`
      }])
      throw new Error(err)
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
