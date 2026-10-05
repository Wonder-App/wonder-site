/*
 * site/assets/start.js — the "start" page: picks the right download for the visitor's computer.
 *
 * Mac     -> asks GitHub for the newest Wonder-<version>.dmg and starts the download by itself.
 * Windows -> the Microsoft Store page (the Store is the only Windows route: no SmartScreen notice).
 * Other   -> says it is a computer app and shows both buttons.
 *
 * Every state keeps a clickable link on the page, so a blocked or failed download never leaves a dead end.
 * The pure parts (pickPlatform, pickDmg) are exported for tests/siteStart.spec.ts.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.WonderStart = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  var STORE_WEB = 'https://apps.microsoft.com/detail/9P688NX68S8Q'
  var RELEASES_API = 'https://api.github.com/repos/Wonder-App/wonder-releases/releases/latest'
  var RELEASES_PAGE = 'https://github.com/Wonder-App/wonder-releases/releases/latest'

  // 'mac' | 'windows' | 'other'. `override` is the ?os= query value (tests, and a forced choice).
  function pickPlatform(ua, maxTouchPoints, override) {
    if (override === 'mac' || override === 'windows' || override === 'other') return override
    ua = ua || ''
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return 'other'
    // iPadOS Safari reports itself as a Mac; a real Mac has no touch screen.
    if (/Macintosh|Mac OS X/i.test(ua)) return maxTouchPoints > 1 ? 'other' : 'mac'
    if (/Windows NT/i.test(ua)) return 'windows'
    return 'other'
  }

  // The download URL of the newest .dmg in a GitHub "latest release" response, or null.
  function pickDmg(release) {
    var assets = (release && release.assets) || []
    for (var i = 0; i < assets.length; i++) {
      if (/^Wonder-[\d.]+\.dmg$/.test(assets[i].name) && assets[i].browser_download_url) return assets[i].browser_download_url
    }
    return null
  }

  function run(doc, win) {
    var q = new URLSearchParams(win.location.search)
    var platform = pickPlatform(win.navigator.userAgent, win.navigator.maxTouchPoints, q.get('os'))
    var $ = function (id) { return doc.getElementById(id) }
    var status = $('status')
    var panels = { mac: $('p-mac'), windows: $('p-windows'), other: $('p-other') }
    Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== platform })
    doc.documentElement.setAttribute('data-platform', platform)
    if (platform !== 'other') $('alt-title').textContent = 'ההורדה לא התחילה, או שזה לא המחשב שלכם?'

    if (platform !== 'mac') return
    var links = [].slice.call(doc.querySelectorAll('[data-dmg]'))
    status.textContent = 'מכינים את ההורדה...'
    win.fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (release) {
        var url = pickDmg(release)
        if (!url) throw new Error('no dmg in the release')
        links.forEach(function (a) { a.href = url })
        status.textContent = 'ההורדה התחילה. אם לא, לחצו על הכפתור.'
        // Only skip the automatic start for a forced preview (?os=mac&nostart=1).
        if (!q.get('nostart')) win.location.assign(url)
      })
      .catch(function () {
        // The buttons already point at the releases page, where the .dmg is listed.
        status.textContent = 'לא הצלחנו להתחיל את ההורדה לבד. לחצו על הכפתור והקובץ ירד מעמוד ההורדות.'
      })
  }

  if (typeof document !== 'undefined' && document.getElementById('p-mac')) run(document, window)

  return { pickPlatform: pickPlatform, pickDmg: pickDmg, STORE_WEB: STORE_WEB, RELEASES_PAGE: RELEASES_PAGE }
})
