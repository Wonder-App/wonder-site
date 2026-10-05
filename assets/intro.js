/*
 * The opening animation of the mark (BACKLOG N19, Amir 2026-10-05): the cursor blinks
 * on paper and the ink builds the W around it. The same clip opens the app
 * (src/intro/intro.ts).
 *
 * Loaded from <head> without defer, so the paper covers the page from the first paint.
 * It plays once a day per browser, never on a reduced-motion setting, and any key,
 * click, touch or scroll ends it at once. If the clip cannot start within a second
 * (slow line, autoplay refused) the page simply shows.
 */
(function () {
  var KEY = 'wonder.intro.shownAt', EVERY_MS = 24 * 3600 * 1000
  var PLAY_MS = 3100, FADE_MS = 450, GIVE_UP_MS = 1100
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    var last = Number(localStorage.getItem(KEY) || 0)
    if (last && Date.now() - last < EVERY_MS) return
  } catch (e) { return }

  var base = (document.currentScript && document.currentScript.src || 'assets/intro.js').replace(/intro\.js.*$/, 'intro/')
  var root = document.createElement('div')
  root.id = 'wonder-intro'
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:grid;place-items:center;' +
    'background:#F0EBE0;opacity:1;transition:opacity ' + FADE_MS + 'ms ease'
  var video = document.createElement('video')
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.preload = 'auto'
  video.poster = base + 'wonder-intro-poster-start.webp'
  video.style.cssText = 'width:min(70vmin,560px);height:min(70vmin,560px);object-fit:cover;' +
    '-webkit-mask-image:radial-gradient(closest-side,#000 62%,transparent 100%);mask-image:radial-gradient(closest-side,#000 62%,transparent 100%)'
  ;[['wonder-intro-720.webm', 'video/webm'], ['wonder-intro-720.mp4', 'video/mp4']].forEach(function (f) {
    var s = document.createElement('source')
    s.src = base + f[0]
    s.type = f[1]
    video.appendChild(s)
  })
  root.appendChild(video)

  var done = false, started = false, timers = []
  var events = ['keydown', 'pointerdown', 'wheel', 'touchstart']
  function end(fade) {
    if (done) return
    done = true
    timers.forEach(clearTimeout)
    events.forEach(function (e) { window.removeEventListener(e, skip, true) })
    root.style.transitionDuration = fade + 'ms'
    root.style.opacity = '0'
    setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root) }, fade + 40)
  }
  function skip() { end(140) }
  events.forEach(function (e) { window.addEventListener(e, skip, { capture: true, passive: true }) })
  timers.push(setTimeout(function () { if (!started) end(0) }, GIVE_UP_MS))
  video.addEventListener('playing', function () {
    if (started) return
    started = true
    try { localStorage.setItem(KEY, String(Date.now())) } catch (e) {}
    timers.push(setTimeout(function () { end(FADE_MS) }, PLAY_MS))
  })
  video.addEventListener('error', function () { end(0) })

  document.documentElement.appendChild(root)
  var p = video.play()
  if (p && p.catch) p.catch(function () { end(0) })
})()
