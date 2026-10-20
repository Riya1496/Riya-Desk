/*
 * Lead Portal Demo: shared page chrome.
 *
 * Renders two things so they live in ONE place:
 *   1. The dark "Sample demo" bar at the top of every page, with Back / All screens / Next links.
 *   2. The portal sidebar, wherever a page has <nav class="portal-nav" data-nav="full|free" data-active="file.html">.
 *
 * How pages use it: put <body data-page="this-file.html">, then load this script
 * right after the sidebar placeholder (portal pages) or right after <body> (other pages).
 * It runs immediately, so the bar and sidebar appear without a flash.
 *
 * To add a screen to the tour: add it to JOURNEY below (order = tour order).
 * To add a portal menu item: add it to NAV_FULL (and NAV_FREE if it should show as locked on the free plan).
 * tools/check.mjs reads this file to verify every listed page exists.
 */
(function () {
  'use strict';

  var JOURNEY = [
    { file: 'website.html', label: 'Your website', stage: 'Before signing up' },
    { file: 'signup.html', label: 'Sign up', stage: 'Before signing up' },
    { file: 'onboarding.html', label: 'Onboarding', stage: 'Free account' },
    { file: 'free-plan.html', label: 'Free plan', stage: 'Free account' },
    { file: 'book-consult.html', label: 'Book the consult', stage: 'Free account' },
    { file: 'setup.html', label: 'Setup tracker', stage: 'After signing' },
    { file: 'overview.html', label: 'Overview', stage: 'Full portal' },
    { file: 'channels.html', label: 'All channels', stage: 'Full portal' },
    { file: 'search-ai.html', label: 'Search & AI', stage: 'Full portal' },
    { file: 'lead-quality.html', label: 'Paid lead quality', stage: 'Full portal' },
    { file: 'inbox.html', label: 'Lead inbox', stage: 'Full portal' },
    { file: 'funnel.html', label: 'Funnel', stage: 'Full portal' },
    { file: 'insights.html', label: 'Weekly insight', stage: 'Full portal' },
    { file: 'lead-view.html', label: 'What leads see', stage: 'Outside the portal' },
    { file: 'weekly-email.html', label: 'Monday email', stage: 'Outside the portal' },
    { file: 'how-it-connects.html', label: 'How it connects', stage: 'Behind the scenes' }
  ];

  var ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    layers: '<path d="M12 4 3 9l9 5 9-5-9-5z"></path><path d="m3 14 9 5 9-5"></path>',
    search: '<circle cx="11" cy="11" r="6.5"></circle><path d="m20 20-4.2-4.2"></path>',
    bars: '<path d="M4 20h16"></path><path d="M7 16v-5"></path><path d="M12 16V6"></path><path d="M17 16v-8"></path>',
    inbox: '<path d="M4 13.5 6.5 5h11l2.5 8.5V19H4z"></path><path d="M4 13.5h4.5l1 2h5l1-2H20"></path>',
    funnel: '<path d="M4 5h16l-6.5 7.5V18l-3 1.5v-7z"></path>',
    bulb: '<path d="M9 18h6"></path><path d="M10 21h4"></path><path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1 1.3 1 2.4h5.6c0-1.1.3-1.8 1-2.4A6 6 0 0 0 12 3z"></path>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>'
  };

  var NAV_FULL = [
    { file: 'overview.html', label: 'Overview', icon: 'grid' },
    { file: 'channels.html', label: 'All channels', icon: 'layers' },
    { file: 'search-ai.html', label: 'Search & AI', icon: 'search' },
    { file: 'lead-quality.html', label: 'Lead quality', icon: 'bars' },
    { file: 'inbox.html', label: 'Lead inbox', icon: 'inbox', badge: '2' },
    { file: 'funnel.html', label: 'Funnel', icon: 'funnel' },
    { file: 'insights.html', label: 'Weekly insight', icon: 'bulb' }
  ];

  var NAV_FREE = [
    { file: 'free-plan.html', label: 'Free dashboard', icon: 'grid' },
    { label: 'All channels', icon: 'layers', locked: true },
    { label: 'Search & AI', icon: 'search', locked: true },
    { label: 'Lead quality', icon: 'bars', locked: true },
    { label: 'Lead inbox', icon: 'inbox', locked: true },
    { label: 'Funnel', icon: 'funnel', locked: true },
    { label: 'Weekly insight', icon: 'bulb', locked: true }
  ];

  var CLIENT = 'Northline Insurance';
  var BRAND_NAME = '[Your brand]';

  function icon(name, size) {
    var s = size || 18;
    return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderDemoBar() {
    if (document.querySelector('.demo-bar')) return;
    var current = (document.body && document.body.getAttribute('data-page')) || '';
    var index = -1;
    for (var i = 0; i < JOURNEY.length; i++) { if (JOURNEY[i].file === current) index = i; }
    var prev = index > 0 ? JOURNEY[index - 1] : null;
    var next = index >= 0 && index < JOURNEY.length - 1 ? JOURNEY[index + 1] : (index === -1 ? JOURNEY[0] : null);
    var step = index >= 0 ? 'Screen ' + (index + 1) + ' of ' + JOURNEY.length + ' · ' + JOURNEY[index].stage : 'Start here';

    var links = '';
    if (prev) links += '<a href="' + prev.file + '" title="Previous: ' + escapeHtml(prev.label) + '">← Back</a>';
    links += '<a href="index.html">All screens</a>';
    if (next) links += '<a href="' + next.file + '" title="Next: ' + escapeHtml(next.label) + '">Next →</a>';

    var bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Demo tour');
    bar.innerHTML = '<div class="demo-bar-inner"><span class="demo-tag">Sample demo · made-up data</span><span class="demo-step">' + escapeHtml(step) + '</span><span class="demo-links">' + links + '</span></div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function renderNav(el) {
    if (el.getAttribute('data-rendered')) return;
    var plan = el.getAttribute('data-nav') || 'full';
    var active = el.getAttribute('data-active') || '';
    var items = plan === 'free' ? NAV_FREE : NAV_FULL;

    var html = '';
    html += '<div class="nav-brand"><span class="logo" aria-hidden="true">YB</span><div><div class="nav-brand-name">' + BRAND_NAME + '</div><div class="nav-brand-sub">Client portal</div></div></div>';
    html += '<div class="nav-client"><div class="nav-client-label">Client</div><div class="nav-client-name">' + CLIENT + '</div><div class="nav-tags">' + (plan === 'free' ? '<span class="tag-free">Free plan</span>' : '') + '<span class="tag-sample">Sample data</span></div></div>';
    html += '<div class="nav-links">';
    items.forEach(function (item) {
      if (item.locked) {
        html += '<a class="nav-link locked" href="#unlock" aria-label="' + escapeHtml(item.label) + ', locked">' + icon(item.icon) + escapeHtml(item.label) + '<span class="lock">' + icon('lock', 15) + '</span></a>';
        return;
      }
      var current = item.file === active ? ' aria-current="page"' : '';
      var badge = item.badge ? '<span class="nav-badge" data-inbox-badge>' + item.badge + '</span>' : '';
      html += '<a class="nav-link" href="' + item.file + '"' + current + '>' + icon(item.icon) + escapeHtml(item.label) + badge + '</a>';
    });
    html += '</div>';
    if (plan === 'free') {
      html += '<a class="btn btn-primary nav-cta" href="#unlock">Unlock everything</a>';
    } else {
      html += '<div class="nav-foot">Data refreshes every 15 minutes</div>';
    }
    el.innerHTML = html;
    el.setAttribute('data-rendered', 'true');
  }

  function renderAllNavs() {
    var navs = document.querySelectorAll('nav[data-nav]');
    for (var i = 0; i < navs.length; i++) renderNav(navs[i]);
  }

  window.DemoShell = { journey: JOURNEY, renderNav: renderNav };

  renderDemoBar();
  renderAllNavs();
  document.addEventListener('DOMContentLoaded', function () { renderDemoBar(); renderAllNavs(); });
})();
