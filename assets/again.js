/*
 * "כבר נרשמתם?" (BACKLOG N258): a writer who cannot find the welcome mail types the address they signed up
 * with, and the relay sends the same mail again (the download and the same key; never a new seat).
 *
 * The page never says whether the address signed up: every answer the relay gives to a well-formed address
 * (sent, not found, too soon, too many) shows the same calm line; a 400 (the relay refused the address's
 * shape, never its membership) asks to check the address. Only a failure to reach the relay at all
 * says something else, and that depends on the network, never on the address.
 *
 * Markup: a link with [data-again] whose aria-controls names a <form class="again"> with one email input.
 * Without JavaScript the link is a mailto: to support@ and the form stays hidden.
 */
(function () {
  var RELAY = 'https://wonder-relay.wonder-pages.workers.dev/api/signup/resend'
  var SAID = 'אם נרשמתם עם הכתובת הזו, המייל בדרך. כדאי להציץ גם בקידומי מכירות ובספאם.'
  var CHECK = 'נראה שחסר משהו בכתובת. אפשר לבדוק ולנסות שוב.'
  var FAILED = 'לא הצלחנו לשלוח עכשיו. אפשר לנסות שוב בעוד רגע, או לכתוב אלינו: support@wonder-pages.com'
  var REST_MS = 5000 // the button rests a moment after an answer, so a double press is not a second ask
  var ADDRESS = /^[^\s<>"',;@]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/

  function wire(link) {
    var form = document.getElementById(link.getAttribute('aria-controls') || '')
    if (!form) return
    var input = form.querySelector('input[type="email"]')
    var button = form.querySelector('button')
    var said = form.querySelector('.again-said')
    link.addEventListener('click', function (e) {
      e.preventDefault()
      var open = form.hidden
      form.hidden = !open
      link.setAttribute('aria-expanded', open ? 'true' : 'false')
      if (open) input.focus()
    })
    var busy = false
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      if (busy) return // one ask at a time, and none in the moment after an answer
      var email = input.value.trim()
      if (!ADDRESS.test(email) || email.length > 254) {
        said.textContent = CHECK
        input.focus()
        return
      }
      busy = true
      button.disabled = true
      said.textContent = ''
      var done = function (text) {
        said.textContent = text
        setTimeout(function () { busy = false; button.disabled = false }, REST_MS)
      }
      try {
        fetch(RELAY, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email }),
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        }).then(
          function (res) { done(res.ok || res.status === 429 ? SAID : res.status === 400 ? CHECK : FAILED) },
          function () { done(FAILED) },
        )
      } catch (err) {
        done(FAILED)
      }
    })
  }

  function start() {
    var links = document.querySelectorAll('[data-again]')
    for (var i = 0; i < links.length; i++) wire(links[i])
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
