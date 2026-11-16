/* Riya Desk analytics: Google Analytics 4 (+ Microsoft Clarity once an ID is added) behind a cookie banner.
   UK and EU rules need consent before analytics cookies are set, so GA4 starts in Google's "consent mode"
   with storage denied (cookieless pings only) and switches on only after the visitor clicks Accept.
   Pages include it with <script src="https://riyadesk.com/analytics.js" defer></script>. */
(function () {
  var GA_ID = 'G-FMJX23ERQ7';
  var CLARITY_ID = '';               // add the Microsoft Clarity project ID here when it exists
  var KEY = 'rd-consent';            // 'granted' | 'denied'

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  gtag('js', new Date());
  gtag('config', GA_ID);
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadClarity() {
    if (!CLARITY_ID || window.clarity) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }
  function grant() { gtag('consent', 'update', { analytics_storage: 'granted' }); loadClarity(); }

  /* Small helper other scripts call: window.rdTrack('event_name', { optional: 'params' }) */
  window.rdTrack = function (name, params) { try { gtag('event', name, params || {}); } catch (e) {} };

  // Booking and scan link clicks, anywhere on the page
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (/cal\.com\//.test(a.href)) window.rdTrack('book_call_click', { link_text: (a.textContent || '').trim().slice(0, 60) });
    else if (/scan\.riyadesk\.com/.test(a.href) && location.hostname !== 'scan.riyadesk.com') window.rdTrack('scan_link_click');
  }, true);

  function banner() {
    var css = '.rd-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:300;max-width:440px;margin-left:auto;padding:16px 18px;border-radius:18px;' +
      'background:rgba(13,11,10,.94);color:#efe6d6;border:1px solid rgba(241,226,196,.22);box-shadow:0 20px 50px -20px rgba(0,0,0,.8);' +
      'font:400 13.5px/1.5 Archivo,"Helvetica Neue",Arial,sans-serif;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}' +
      '.rd-cookie p{margin:0 0 12px}.rd-cookie div{display:flex;gap:8px;flex-wrap:wrap}' +
      '.rd-cookie button{font:500 11px/1 Archivo,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:11px 16px;border-radius:999px;cursor:pointer;border:1px solid rgba(241,226,196,.4);background:transparent;color:#f1e2c4}' +
      '.rd-cookie button.ok{background:#f1e2c4;color:#17120e;border-color:#f1e2c4}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'rd-cookie'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = '<p>I use analytics cookies to see which parts of this site are useful. Nothing is sold or used for ads. OK to turn them on?</p>' +
      '<div><button type="button" class="ok">Accept</button><button type="button" class="no">Decline</button></div>';
    box.querySelector('.ok').onclick = function () { setChoice('granted'); grant(); box.remove(); };
    box.querySelector('.no').onclick = function () { setChoice('denied'); box.remove(); };
    document.body.appendChild(box);
  }

  var choice = getChoice();
  if (choice === 'granted') grant();
  else if (choice !== 'denied') {
    if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
  }
})();
