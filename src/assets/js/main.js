/* hutt.io — main.js */

/* ── Theme Toggle ── */
(function () {
  const root = document.documentElement;
  const btn  = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  const ICON_DARK  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const ICON_LIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';

  // Systempreferenz als Startwert
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // Gespeicherte Präferenz überschreibt Systemwert
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch (_) {}

  function applyTheme(t) {
    theme = t;
    root.setAttribute('data-theme', t);
    btn.innerHTML = t === 'dark' ? ICON_LIGHT : ICON_DARK;
    btn.setAttribute('aria-label', t === 'dark' ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln');
    try { localStorage.setItem('theme', t); } catch (_) {}
  }

  applyTheme(theme);
  btn.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
})();


/* ── Kategorie-Filter ── */
(function () {
  document.querySelectorAll('.filter-bar').forEach(function (bar) {
    // zugehöriges card-grid: nächstes Geschwister-Element
    const grid = bar.nextElementSibling;
    if (!grid) return;

    const chips = bar.querySelectorAll('.filter-chip');
    const cards = grid.querySelectorAll('.card');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
        chip.setAttribute('aria-pressed', 'true');

        const filter = chip.dataset.filter;

        cards.forEach(function (card) {
          const cats = (card.dataset.category || '').split(' ');
          const show = filter === 'all' || cats.includes(filter);
          // hidden-Attribut für Accessibility + CSS
          if (show) {
            card.removeAttribute('hidden');
          } else {
            card.setAttribute('hidden', '');
          }
        });
      });
    });
  });
})();


/* ── Lite-YouTube: Script laden (self-hosted oder CDN) ── */
(function () {
  // Nur laden wenn lite-youtube-Elemente auf der Seite sind
  if (!document.querySelector('lite-youtube')) return;

  const s = document.createElement('script');
  s.src = '/assets/js/lite-yt-embed.js';
  s.defer = true;
  document.head.appendChild(s);

  const l = document.createElement('link');
  l.rel  = 'stylesheet';
  l.href = '/assets/css/lite-yt-embed.css';
  document.head.appendChild(l);
})();


/* ── Kontaktformular ── */
(function () {
  const form   = document.getElementById('kontakt-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Honeypot-Check
    if (form.elements['website'] && form.elements['website'].value) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    status.className = 'form-status';
    status.textContent = '';

    const data = {
      name:      form.elements['name'].value.trim(),
      email:     form.elements['email'].value.trim(),
      betreff:   form.elements['betreff'].value.trim(),
      nachricht: form.elements['nachricht'].value.trim(),
    };

    // Einfache Client-seitige Validierung
    if (!data.name || !data.email || !data.nachricht) {
      status.className = 'form-status error';
      status.textContent = 'Bitte fülle alle Pflichtfelder aus.';
      btn.disabled = false;
      btn.textContent = 'Nachricht senden';
      return;
    }

    try {
      const res = await fetch('/api/kontakt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        status.className = 'form-status success';
        status.textContent = 'Danke! Deine Nachricht ist angekommen. Ich melde mich so schnell wie möglich.';
        form.reset();
      } else {
        throw new Error(res.statusText);
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = 'Etwas ist schiefgelaufen. Schreib mir direkt an jannis@hutt.io.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Nachricht senden';
    }
  });
})();


/* ── Aktiver Nav-Link (Hash-basiert) ── */
(function () {
  const links = document.querySelectorAll('.nav-link[href^="/#"]');
  const sections = document.querySelectorAll('section[id], div[id]');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (link) {
        const target = link.getAttribute('href').replace('/', '');
        link.setAttribute('aria-current', target === '#' + entry.target.id ? 'true' : 'false');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();
