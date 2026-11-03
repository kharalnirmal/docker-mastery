/* No external runtime dependencies; hash routes also work on static hosting. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const lessons = window.LESSONS;
  const mobile = matchMedia('(max-width: 900px)');
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault();
    ($('home').hidden ? $('reading') : $('home')).focus();
  });
  let current = null;
  let lastFocus = null;
  let selectedResult = 0;
  const icons = {
    'first-container': '<path d="m3 7 9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10"/>',
    'container-lifecycle': '<path d="m8 4 12 8-12 8Z"/>',
    'first-dockerfile': '<path d="M14 2H6v20h12V6ZM14 2v5h5M8 12h8M8 16h6"/>',
    'container-networks': '<rect x="8" y="3" width="8" height="6" rx="1"/><path d="M12 9v5M4 14h16M4 14v4M20 14v4"/><rect x="1" y="18" width="6" height="4"/><rect x="17" y="18" width="6" height="4"/>',
    'persistent-data': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
    'troubleshooting': '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    'command-reference': '<path d="m4 5 7 7-7 7M13 19h7"/>'
  };
  const svg = paths => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const safeStorage = {
    get() { try { return localStorage.getItem('field-guide-theme'); } catch { return null; } },
    set(value) { try { localStorage.setItem('field-guide-theme', value); } catch { /* Private storage may be unavailable. */ } }
  };
  function theme(value) {
    document.documentElement.dataset.theme = value;
    $('theme').innerHTML = svg(value === 'dark' ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' : '<path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z"/>');
    $('theme').setAttribute('aria-label', `Switch to ${value === 'dark' ? 'light' : 'dark'} theme`);
  }
  const stored = safeStorage.get();
  theme(['light', 'dark'].includes(stored) ? stored : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('theme').addEventListener('click', () => {
    const value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    theme(value); safeStorage.set(value);
  });
  function drawer(open, restore = true) {
    open = open && mobile.matches && !$('workspace').hidden;
    if (open) lastFocus = document.activeElement;
    $('sidebar').classList.toggle('open', open);
    $('menu').setAttribute('aria-expanded', String(open));
    $('menu').setAttribute('aria-label', open ? 'Close lesson navigation' : 'Open lesson navigation');
    $('backdrop').hidden = !open;
    $('sidebar').inert = mobile.matches && !open;
    $('reading').inert = open;
    document.querySelector('.topbar').inert = open;
    if (open) requestAnimationFrame(() => {
      if ($('sidebar').classList.contains('open')) $('close-menu').focus();
    });
    else if (restore && lastFocus && !lastFocus.closest('[hidden]')) lastFocus.focus();
  }
  $('menu').addEventListener('click', () => drawer(!$('sidebar').classList.contains('open')));
  $('close-menu').addEventListener('click', () => drawer(false));
  $('backdrop').addEventListener('click', () => drawer(false));
  mobile.addEventListener('change', () => {
    const wasOpen = $('sidebar').classList.contains('open');
    drawer(false, false);
    if (wasOpen) $('reading').focus();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if ($('search-dialog').open) $('search-dialog').close(); else openSearch();
      return;
    }
    if (!$('sidebar').classList.contains('open')) return;
    if (event.key === 'Escape') { event.preventDefault(); drawer(false); }
    if (event.key === 'Tab') {
      const nodes = [...$('sidebar').querySelectorAll('a,button,input')].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function navigation() {
    $('lesson-nav').replaceChildren();
    let group, section;
    for (const item of lessons) {
      if (group !== item.group) {
        const label = document.createElement('h2'); label.className = 'nav-group'; label.textContent = item.group;
        section = document.createElement('div'); section.className = 'nav-section'; section.append(label);
        $('lesson-nav').append(section); group = item.group;
      }
      const a = document.createElement('a'); a.href = `#${item.id}`; a.className = 'lesson-link';
      a.innerHTML = svg(icons[item.id] || icons['command-reference']);
      const title = document.createElement('span'); title.textContent = item.navTitle || item.title; a.append(title);
      a.title = `${item.title} · ${item.level} · ${item.minutes} min`;
      if (item.id === current) a.setAttribute('aria-current', 'page');
      a.addEventListener('click', () => { drawer(false, false); if (current === item.id) $('reading').focus(); });
      section.append(a);
    }
  }
  function search() {
    const query = $('search').value.trim().toLowerCase();
    const results = lessons.filter(item => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(query));
    $('search-results').replaceChildren(); selectedResult = 0;
    for (const item of results) {
      const a = document.createElement('a'); a.href = `#${item.id}`; a.textContent = item.title;
      const meta = document.createElement('small'); meta.textContent = `${item.group} · ${item.level} · ${item.minutes} min`;
      a.append(meta); a.addEventListener('click', () => { $('search-dialog').close(); if (current === item.id) $('reading').focus(); });
      $('search-results').append(a);
    }
    $('search-status').textContent = query ? `${results.length} lesson${results.length === 1 ? '' : 's'} found` : `${lessons.length} lessons · Start typing to search`;
    selectResult(0);
  }
  function selectResult(index) {
    const links = [...$('search-results').querySelectorAll('a')];
    selectedResult = links.length ? (index + links.length) % links.length : 0;
    links.forEach((link, i) => link.classList.toggle('selected', i === selectedResult));
    links[selectedResult]?.scrollIntoView({ block: 'nearest' });
  }
  function openSearch() {
    const fromDrawer = $('sidebar').classList.contains('open');
    drawer(false, false); $('search').value = ''; search();
    if (fromDrawer) $('search-trigger').focus();
    $('search-dialog').showModal(); $('search').focus();
  }
  $('search-trigger').addEventListener('click', openSearch);
  $('close-search').addEventListener('click', () => $('search-dialog').close());
  $('search-dialog').addEventListener('click', event => {
    const rect = $('search-dialog').getBoundingClientRect();
    if (event.target === $('search-dialog') && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) $('search-dialog').close();
  });
  $('search').addEventListener('input', search);
  $('search').addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Enter') $('search-results').querySelectorAll('a')[selectedResult]?.click();
      else selectResult(selectedResult + (event.key === 'ArrowDown' ? 1 : -1));
    }
  });
  function codeFrames() {
    $('lesson').querySelectorAll('.table-wrap').forEach(table => {
      table.tabIndex = 0;
      table.setAttribute('role', 'group');
      table.setAttribute('aria-label', table.querySelector('caption')?.textContent || 'Scrollable reference table');
    });
    $('lesson').querySelectorAll('pre').forEach(pre => {
      pre.tabIndex = 0;
      pre.setAttribute('aria-label', 'Code example; scroll horizontally for long lines');
      const frame = document.createElement('div'); frame.className = 'code-frame';
      const head = document.createElement('div'); head.className = 'code-frame-header';
      const title = document.createElement('span'); title.className = 'code-frame-title';
      title.textContent = pre.previousElementSibling?.classList.contains('code-label') ? pre.previousElementSibling.textContent : 'Terminal · see explanation below';
      const copy = document.createElement('button'); copy.className = 'code-copy'; copy.textContent = 'Copy'; copy.setAttribute('aria-label', 'Copy code block');
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(pre.textContent); copy.textContent = 'Copied'; $('copy-status').textContent = 'Code copied. Review the command before running it.'; }
        catch { copy.textContent = 'Select manually'; $('copy-status').textContent = 'Clipboard unavailable. Select and copy the code manually.'; }
      });
      head.append(title, copy); pre.before(frame); frame.append(head, pre);
    });
  }
  function activeContents() {
    const headings = [...$('lesson').querySelectorAll('h2')];
    const offset = $('reading').getBoundingClientRect().top + 80;
    const active = headings.filter(h => h.getBoundingClientRect().top <= offset).at(-1) || headings[0];
    for (const link of $('toc').querySelectorAll('a')) {
      if (active && link.hash.endsWith(`/${active.id}`)) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  $('reading').addEventListener('scroll', activeContents, { passive: true });
  function route(event) {
    const parts = location.hash.slice(1).split('/');
    const id = parts[0] || 'home';
    drawer(false, false);
    const item = lessons.find(entry => entry.id === id);
    $('home').hidden = id !== 'home';
    $('workspace').hidden = id === 'home';
    $('menu').hidden = id === 'home';
    document.body.classList.toggle('is-home', id === 'home');
    document.querySelector('.skip').href = id === 'home' ? '#home' : '#reading';
    if (id === 'home') { current = null; document.title = 'Docker Mastery · Hands-on Docker Learning'; return; }
    if (!item) {
      $('lesson').innerHTML = '<h1>Lesson not found</h1><p>This lesson is not in the published Docker batch.</p><p><a href="#first-container">Start with your first container</a> or <a href="#home">return home</a>.</p>';
      $('toc').replaceChildren(); current = null; document.title = 'Lesson not found · Container Field Guide';
    } else {
      const changed = current !== item.id;
      current = item.id;
      const index = lessons.indexOf(item);
      if (changed) {
        $('lesson').innerHTML = `<p class="breadcrumb">Docker / ${item.group}</p><h1>${item.title}</h1><div class="lesson-meta"><span>${item.level}</span><span>${item.minutes} min</span><span>WSL Bash · macOS · Linux</span></div><p class="lede">${item.description}</p>${item.html}<footer class="lesson-footer"><a href="#${index ? lessons[index - 1].id : 'home'}"><small>← ${index ? 'Previous lesson' : 'Back home'}</small>${index ? lessons[index - 1].title : 'The Ninja DevOps Journey'}</a><a href="#${index < lessons.length - 1 ? lessons[index + 1].id : 'home'}"><small>${index < lessons.length - 1 ? 'Next lesson →' : 'Batch complete →'}</small>${index < lessons.length - 1 ? lessons[index + 1].title : 'Return to learning paths'}</a></footer>`;
        codeFrames();
      }
      $('toc').replaceChildren();
      for (const heading of $('lesson').querySelectorAll('h2')) {
        const a = document.createElement('a'); a.href = `#${id}/${heading.id}`; a.textContent = heading.textContent;
        $('toc').append(a);
      }
      document.title = `${item.title} · Container Field Guide`;
      if (changed) $('reading').scrollTop = 0;
      if (parts[1]) document.getElementById(parts[1])?.scrollIntoView();
      activeContents();
    }
    navigation();
    // Initial deep links should not paint a large focus ring before interaction.
    // Hash changes still move focus to the new lesson for keyboard/screen readers.
    if (event) $('reading').focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  $('lesson-count').textContent = `${lessons.length} lessons`;
  navigation(); route();
})();
