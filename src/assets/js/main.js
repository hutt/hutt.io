/* hutt.io — main.js */

/* ── Theme Toggle ── */
(function () {
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');

  const ICON_DARK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const ICON_LIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (!btn) return;
    btn.innerHTML = t === 'dark' ? ICON_LIGHT : ICON_DARK;
    btn.setAttribute('aria-label', t === 'dark'
      ? 'Zum hellen Modus wechseln'
      : 'Zum dunklen Modus wechseln');
  }

  var stored;
  try { stored = localStorage.getItem('theme'); } catch (_) { }
  applyTheme(stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    try { if (localStorage.getItem('theme')) return; } catch (_) { }
    applyTheme(e.matches ? 'dark' : 'light');
  });

  if (btn) {
    btn.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch (_) { }
      applyTheme(next);
    });
  }
})();

/* ── Portfolio-Filter ── */
(function () {
  const grid = document.getElementById('portfolio-grid');
  const artBar = document.getElementById('filter-art');
  const skillBar = document.getElementById('filter-skills');
  const cardsMoreBtn = document.getElementById('cards-more-btn');
  const expandBtn = document.getElementById('skills-expand-btn');
  const featuredBtn = document.getElementById('filter-featured');

  if (!grid || !artBar || !skillBar) return;

  const cards = Array.from(grid.querySelectorAll('.card'));
  const artChips = Array.from(artBar.querySelectorAll('.filter-chip')).filter(chip => chip.id !== 'filter-featured');
  const skillChips = Array.from(skillBar.querySelectorAll('.filter-chip'));
  const expandableSkillChips = skillChips.filter(chip => chip.dataset.value !== '');

  // LOGIK-ÄNDERUNG: activeArt = null bedeutet "kein Chip leuchtet in der ersten Reihe"
  let activeArt = null;
  let activeSkill = '';
  let activeFeatured = true;
  let cardsExpanded = false;

  const limitDesktop = parseInt(grid.dataset.limit, 10) || 8;
  const limitMobile = parseInt(grid.dataset.limitMobile, 10) || 4;

  function getLimit() {
    return window.innerWidth < 600 ? limitMobile : limitDesktop;
  }

  function parseList(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  function updateSkillChips() {
    const availableSkills = new Set();

    cards.forEach(card => {
      const cardArts = parseList(card.getAttribute('data-art'));
      const cardSkills = parseList(card.getAttribute('data-skills'));
      const isFeatured = card.getAttribute('data-featured') === 'true';

      // null wird hier wie 'Alle' behandelt (zeigt alle an, die featured sind)
      const matchArt = (activeArt === null || activeArt === '' || cardArts.includes(activeArt));
      const matchFeatured = (!activeFeatured || isFeatured);

      if (matchArt && matchFeatured) {
        cardSkills.forEach(skill => availableSkills.add(skill));
      }
    });

    expandableSkillChips.forEach(chip => {
      const val = chip.dataset.value.trim();
      if (availableSkills.has(val)) {
        chip.hidden = false;
        chip.removeAttribute('hidden');
        chip.style.display = '';
      } else {
        chip.hidden = true;
        chip.setAttribute('hidden', '');
        chip.style.display = 'none';
      }
    });

    if (activeSkill !== '' && !availableSkills.has(activeSkill)) {
      activeSkill = '';
    }

    setPressedState(skillChips, activeSkill);
    updateSkillsOverflow();
  }

  function updateSkillsOverflow() {
    if (!expandBtn) return;

    requestAnimationFrame(() => {
      skillBar.classList.remove('is-collapsed');

      const visibleChips = skillChips.filter(c => !c.hidden && c.id !== 'skills-expand-btn');
      if (visibleChips.length === 0) {
        expandBtn.hidden = true;
        expandBtn.style.display = 'none';
        return;
      }

      const firstRowTop = visibleChips[0].offsetTop;
      const hasOverflow = visibleChips.some(chip => chip.offsetTop > firstRowTop + 10);

      if (hasOverflow) {
        expandBtn.hidden = false;
        expandBtn.style.display = '';
        skillBar.classList.add('is-collapsed');
        expandBtn.textContent = 'Mehr ▾';
        expandBtn.setAttribute('aria-expanded', 'false');
      } else {
        expandBtn.hidden = true;
        expandBtn.style.display = 'none';
      }
    });
  }

  function setPressedState(chips, activeValue) {
    chips.forEach(chip => {
      const val = (chip.dataset.value || '').trim();
      // Bei activeValue = null (Featured Modus) wird hier für alle Art-Chips richtigerweise 'false' gesetzt
      chip.setAttribute('aria-pressed', val === activeValue ? 'true' : 'false');
    });
  }

  function setFeaturedPressedState() {
    if (!featuredBtn) return;
    featuredBtn.setAttribute('aria-pressed', activeFeatured ? 'true' : 'false');
  }

  function applyFilters() {
    const matchingCards = [];

    cards.forEach(card => {
      const cardArts = parseList(card.getAttribute('data-art'));
      const cardSkills = parseList(card.getAttribute('data-skills'));
      const isFeatured = card.getAttribute('data-featured') === 'true';

      const matchArt = (activeArt === null || activeArt === '' || cardArts.includes(activeArt));
      const matchSkill = (activeSkill === '' || cardSkills.includes(activeSkill));
      const matchFeatured = (!activeFeatured || isFeatured);

      if (matchArt && matchSkill && matchFeatured) {
        matchingCards.push(card);
      } else {
        card.hidden = true;
        card.setAttribute('hidden', '');
        card.style.display = 'none';
      }
    });

    matchingCards.forEach((card, index) => {
      if (!cardsExpanded && index >= getLimit()) {
        card.hidden = true;
        card.setAttribute('hidden', '');
        card.style.display = 'none';
      } else {
        card.hidden = false;
        card.removeAttribute('hidden');
        card.style.display = '';
      }
    });

    if (cardsMoreBtn) {
      if (matchingCards.length <= getLimit()) {
        cardsMoreBtn.hidden = true;
        cardsMoreBtn.setAttribute('hidden', '');
        cardsMoreBtn.style.display = 'none';
      } else {
        cardsMoreBtn.hidden = false;
        cardsMoreBtn.removeAttribute('hidden');
        cardsMoreBtn.style.display = '';
        if (cardsExpanded) {
          cardsMoreBtn.textContent = 'Weniger anzeigen';
          cardsMoreBtn.classList.replace('btn-primary', 'btn-secondary');
        } else {
          cardsMoreBtn.textContent = `Alle ${matchingCards.length} ansehen`;
          cardsMoreBtn.classList.replace('btn-secondary', 'btn-primary');
        }
      }
    }
  }

  /* ── Event Listeners ── */
  if (featuredBtn) {
    featuredBtn.addEventListener('click', () => {
      if (activeFeatured) {
        // Klickt man Featured nochmal an (deaktivieren), Fallback auf "Alle"
        activeFeatured = false;
        activeArt = '';
      } else {
        // Klickt man Featured an, alle normalen Art-Chips inaktiv schalten
        activeFeatured = true;
        activeArt = null;
      }
      cardsExpanded = false;
      setFeaturedPressedState();
      setPressedState(artChips, activeArt);
      updateSkillChips();
      applyFilters();
    });
  }

  artChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = (chip.dataset.value || '').trim();

      // Sobald ein Art-Chip geklickt wird, ist der globale Featured-Modus aus
      activeFeatured = false;

      // Normales Toggle-Verhalten für die restliche Zeile
      if (activeArt === val) {
        activeArt = ''; // Zurück auf "Alle", wenn man denselben klickt
      } else {
        activeArt = val;
      }

      cardsExpanded = false;
      setFeaturedPressedState();
      setPressedState(artChips, activeArt);
      updateSkillChips();
      applyFilters();
    });
  });

  skillChips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.hidden) return;
      const val = (chip.dataset.value || '').trim();
      activeSkill = (activeSkill === val) ? '' : val;
      cardsExpanded = false;
      setPressedState(skillChips.filter(c => !c.hidden), activeSkill);
      applyFilters();
    });
  });

  if (cardsMoreBtn) {
    cardsMoreBtn.addEventListener('click', () => {
      cardsExpanded = !cardsExpanded;
      applyFilters();
    });
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const collapsed = skillBar.classList.toggle('is-collapsed');
      expandBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      expandBtn.textContent = collapsed ? 'Mehr ▾' : 'Weniger ▴';
    });
  }

  window.addEventListener('resize', () => {
    updateSkillsOverflow();
    applyFilters();
  });

  /* ── Initialisierung ── */
  setPressedState(artChips, activeArt);
  setPressedState(skillChips, activeSkill);
  setFeaturedPressedState();
  updateSkillChips();
  applyFilters();
})();

/* ── Lite-YouTube: Script laden ── */
(function () {
  if (!document.querySelector('lite-youtube')) return;
  const s = document.createElement('script');
  s.src = '/assets/js/lite-yt-embed.js';
  s.defer = true;
  document.head.appendChild(s);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = '/assets/css/lite-yt-embed.css';
  document.head.appendChild(l);
})();

/* ── Kontaktformular ── */
(function () {
  const form = document.getElementById('kontakt-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (form.elements['website'] && form.elements['website'].value) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    status.className = 'form-status';
    status.textContent = '';

    const data = {
      name: form.elements['name'].value.trim(),
      email: form.elements['email'].value.trim(),
      betreff: form.elements['betreff'].value.trim(),
      nachricht: form.elements['nachricht'].value.trim(),
    };

    if (!data.name || !data.email || !data.nachricht) {
      status.className = 'form-status error';
      status.textContent = 'Bitte fülle alle Pflichtfelder aus.';
      btn.disabled = false;
      btn.textContent = 'Nachricht senden';
      return;
    }

    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

/* ── PGP Modal Logic ── */
(function () {
  const modal = document.getElementById('pgp-modal');
  const openBtn = document.getElementById('pgp-modal-btn');
  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', () => { modal.showModal(); });

  modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => { modal.close(); });
  });

  modal.addEventListener('click', (e) => {
    const r = modal.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      modal.close();
    }
  });

  const supportsStartingStyle = CSS.supports('selector(dialog)') &&
    typeof CSSStartingStyleRule !== 'undefined';

  if (!supportsStartingStyle) {
    openBtn.addEventListener('click', () => {
      modal.showModal();
      requestAnimationFrame(() => modal.classList.add('is-open'));
    });
    modal.addEventListener('close', () => { modal.classList.remove('is-open'); });
  }
})();

/* ── Portrait Easter Egg ── */
(function () {
  const portrait = document.querySelector('.hero-portrait');
  if (!portrait) return;

  const style = document.createElement('style');
  style.textContent = '.hero-portrait.ready:not(.is-wobbling) { animation: none !important; }';
  document.head.appendChild(style);

  let clicks = 0;
  let resetTimer = null;
  let cooldown = false;
  let cooldownScale = 1;
  const SCALE_STEP = 0.07;
  const MIN_SCALE = 0.0;

  portrait.style.cursor = 'grab';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    portrait.style.setProperty('opacity', '1', 'important');
    portrait.classList.add('ready');
  } else {
    portrait.style.cssText += ';opacity:0;animation:fade-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s forwards';
    portrait.addEventListener('animationend', function lockOpacity(ev) {
      if (ev.animationName !== 'fade-up') return;
      portrait.style.animation = '';
      portrait.style.setProperty('opacity', '1', 'important');
      portrait.classList.add('ready');
      portrait.removeEventListener('animationend', lockOpacity);
    });
  }

  function buildPicture(telephon) {
    const name = telephon ? 'telephon' : 'portrait';
    const alt = telephon ? 'Jannis Hutt am Telefon' : 'Jannis Hutt';
    const widths = [96, 176, 352, 480, 960];
    const sizes = '(max-width: 860px) 6rem, 11rem';
    const srcset = ext => widths.map(w => `/assets/img/${name}-${w}w.${ext} ${w}w`).join(', ');
    return `<picture>
      <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
      <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
      <img
        src="/assets/img/${name}-96w.jpeg"
        srcset="${srcset('jpeg')}"
        sizes="${sizes}"
        alt="${alt}"
        width="960" height="1280"
        loading="eager"
        decoding="async"
        style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s ease;"
        onload="this.style.opacity='1'">
    </picture>`;
  }

  function spawnDust(clickX, clickY) {
    if (reducedMotion) return;
    const container = portrait.closest('.hero-inner') || portrait.parentElement;
    const containerRect = container.getBoundingClientRect();

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    const absX = clickX - containerRect.left;
    const absY = clickY - containerRect.top;

    const count = 9 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const puff = document.createElement('span');
      puff.className = 'dust-puff';

      puff.style.setProperty('mix-blend-mode', 'normal', 'important');
      puff.style.setProperty('background', 'radial-gradient(circle, rgba(220,220,220,0.95) 0%, rgba(180,180,180,0.6) 40%, transparent 75%)', 'important');

      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 25;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - (4 + Math.random() * 10);
      const scale = 1.4 + Math.random() * 2.0;

      puff.style.setProperty('--x', `${absX}px`);
      puff.style.setProperty('--y', `${absY}px`);
      puff.style.setProperty('--dx', `${dx}px`);
      puff.style.setProperty('--dy', `${dy}px`);
      puff.style.setProperty('--scale', scale.toFixed(2));

      container.appendChild(puff);
      puff.addEventListener('animationend', () => puff.remove(), { once: true });
    }
  }

  function switchToTelephon() {
    cooldown = true;
    cooldownScale = 1;
    clicks = 0;
    clearTimeout(resetTimer);

    portrait.innerHTML = buildPicture(true);
    portrait.style.setProperty('opacity', '1', 'important');
    portrait.style.cursor = 'grab';

    setTimeout(() => {
      const numSteps = 3 + Math.floor(Math.random() * 4);
      const weights = Array.from({ length: numSteps }, () => 0.1 + Math.random() * 0.9);
      const weightSum = weights.reduce((a, b) => a + b, 0);
      const steps = weights.map(w => w / weightSum);
      const pauses = Array.from({ length: numSteps }, () => 250 + Math.random() * 2000);
      let currentScale = 0;

      steps.forEach((stepSize, i) => {
        const delay = pauses.slice(0, i).reduce((a, b) => a + b, 0);
        setTimeout(() => {
          currentScale = Math.min(1, currentScale + stepSize);
          const isLast = i === steps.length - 1;

          portrait.style.setProperty(
            'transition',
            `transform ${isLast ? '0.6s' : '0.3s'} cubic-bezier(0.34, 1.56, 0.64, 1)`,
            'important'
          );
          portrait.style.setProperty('transform', `scale(${currentScale.toFixed(3)})`, 'important');

          if (isLast) {
            setTimeout(() => {
              portrait.innerHTML = buildPicture(false);
            }, 300);

            setTimeout(() => {
              portrait.style.removeProperty('transition');
              portrait.style.removeProperty('transform');
              cooldownScale = 1;
              clicks = 0;
              cooldown = false;
            }, 650);
          }
        }, delay);
      });
    }, 5000);
  }

  portrait.addEventListener('click', function (e) {
    clicks++;
    clearTimeout(resetTimer);

    if (cooldown) {
      cooldownScale = Math.max(MIN_SCALE, cooldownScale - SCALE_STEP);
      portrait.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', 'important');
      portrait.style.setProperty('transform', `scale(${cooldownScale.toFixed(3)})`, 'important');
      spawnDust(e.clientX, e.clientY);
      return;
    }

    spawnDust(e.clientX, e.clientY);
    portrait.classList.remove('is-wobbling');
    void portrait.offsetWidth;
    portrait.classList.add('is-wobbling');
    portrait.addEventListener('animationend', function onWobbleEnd(ev) {
      if (ev.animationName !== 'portrait-wobble') return;
      portrait.classList.remove('is-wobbling');
      portrait.removeEventListener('animationend', onWobbleEnd);
    });

    if (clicks >= 10) {
      clicks = 0;
      switchToTelephon();
      return;
    }

    resetTimer = setTimeout(() => { clicks = 0; }, 2000);
  });
})();

/* ── Lightbox Logic ── */
(function () {
  const triggers = document.querySelectorAll('.lightbox-trigger');
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  if (!modal || !content || triggers.length === 0) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // Bild-Markup in die Lightbox kopieren
      content.innerHTML = trigger.innerHTML;

      // Browser anweisen, die große Variante des Bildes zu laden
      content.querySelectorAll('img, source').forEach(el => {
        if (el.hasAttribute('sizes')) {
          el.setAttribute('sizes', '960px');
        }
      });

      modal.showModal();
    });
  });

  // Modal schließen über den Button
  modal.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => modal.close());
  });

  // Modal schließen beim Klick auf den Hintergrund (Backdrop)
  modal.addEventListener('click', (e) => {
    // Bei <dialog> entspricht e.target === modal dem Klick auf den ::backdrop
    if (e.target === modal) {
      modal.close();
    }
  });

  // Nach dem Schließen den Inhalt leeren (spart Speicher)
  modal.addEventListener('close', () => {
    setTimeout(() => { content.innerHTML = ''; }, 300); // Warten bis CSS-Transition fertig ist
  });
})();

/* Hero Netzwerk-Canvas */
(function () {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function initNetworkCanvas(sectionSelector, canvasSelector, userConfig = {}) {
    const section = document.querySelector(sectionSelector);
    const canvas = section?.querySelector(canvasSelector);
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');

    const BASE_CONFIG = {
      densityArea: 20000,
      densityAreaReduced: 24000,
      minParticles: 14,
      maxParticles: 96,

      idleFluxPerMinute: 6,
      idleFluxPerMinuteReduced: 0.8,

      opacityPoint: 0.58,
      opacityLine: 0.26,
      opacityGlow: 0.12,

      pointRadiusMin: 1.3,
      pointRadiusMax: 3.0,
      pointDragRadius: 16,
      lineWidth: 0.85,

      speed: 0.016,
      speedReduced: 0.009,
      steeringForce: 0.0017,
      steeringForceReduced: 0.001,
      damping: 0.992,
      dampingReduced: 0.994,

      springK: 0.0016,
      springDamping: 0.013,
      elasticityMin: 0.9,
      elasticityMax: 1.1,

      wallPadding: 46,
      wallForce: 0.0029,

      minConnectionsPerParticle: 2,
      maxConnectionsPerParticle: 5,
      maxConnectionDistance: 240,

      spawnDurationMin: 1200,
      spawnDurationMax: 2800,
      despawnDurationMin: 1400,
      despawnDurationMax: 3200,

      headingChangeMinMs: 5000,
      headingChangeMaxMs: 30000,
      headingDeltaMinDeg: 1,
      headingDeltaMaxDeg: 42,

      recentSpawnProtectionMs: 15000,

      resizeMinDelayMs: 1000,
      resizeMaxDelayMs: 60000,
      resizeBudgetMs: 60000,
      resizeDebounceMs: 140,

      dragImpulseScale: 0.18,

      idleMinDelayMs: 12000,
      idleMaxDelayMs: 38000,

      interactive: true,
      deriveForDarkSurface: false
    };

    const CONFIG = { ...BASE_CONFIG, ...userConfig };

    let width = 1;
    let height = 1;
    let particles = [];
    let springs = [];
    let particleById = new Map();
    let nextParticleId = 1;
    let rafId = 0;
    let lastTime = 0;
    let resizeTimer = 0;
    let resizePlanId = 0;
    let idleTimer = 0;
    let pendingAdds = 0;
    let pendingRemovals = 0;
    let dragState = null;
    let theme = null;

    const random = (min, max) => Math.random() * (max - min) + min;
    const randomInt = (min, max) => Math.floor(random(min, max + 1));
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const nowMs = () => performance.now();

    const easeInOut = t => t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function shortestAngleDelta(a, b) {
      let diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      return diff;
    }

    function rgbaFromCssColor(value, fallback = 'rgba(0,0,0,1)') {
      const probe = document.createElement('span');
      probe.style.position = 'absolute';
      probe.style.opacity = '0';
      probe.style.pointerEvents = 'none';
      probe.style.color = value || fallback;
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).color || fallback;
      probe.remove();

      const match = computed.match(/rgba?\(([^)]+)\)/);
      if (!match) return { r: 0, g: 0, b: 0, a: 1 };

      const parts = match[1].split(',').map(part => part.trim());
      return {
        r: Number(parts[0]) || 0,
        g: Number(parts[1]) || 0,
        b: Number(parts[2]) || 0,
        a: parts[3] !== undefined ? Number(parts[3]) : 1
      };
    }

    function cssVar(name, fallback = '') {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    function refreshTheme() {
      const primary = rgbaFromCssColor(cssVar('--color-primary'), 'rgba(10,68,69,1)');
      const soft = rgbaFromCssColor(cssVar('--color-primary-soft'), 'rgba(219,232,232,1)');
      const text = rgbaFromCssColor(cssVar('--color-text'), 'rgba(24,23,19,1)');
      const bg = rgbaFromCssColor(cssVar('--color-bg'), 'rgba(245,244,240,1)');
      const inverse = rgbaFromCssColor(cssVar('--color-text-inverse'), 'rgba(245,244,240,1)');

      if (CONFIG.deriveForDarkSurface) {
        theme = {
          point: {
            r: Math.round(inverse.r * 0.75 + soft.r * 0.25),
            g: Math.round(inverse.g * 0.75 + soft.g * 0.25),
            b: Math.round(inverse.b * 0.75 + soft.b * 0.25)
          },
          line: {
            r: Math.round(inverse.r * 0.55 + soft.r * 0.45),
            g: Math.round(inverse.g * 0.55 + soft.g * 0.45),
            b: Math.round(inverse.b * 0.55 + soft.b * 0.45)
          },
          glow: {
            r: Math.round(primary.r * 0.2 + inverse.r * 0.8),
            g: Math.round(primary.g * 0.2 + inverse.g * 0.8),
            b: Math.round(primary.b * 0.2 + inverse.b * 0.8)
          }
        };
        return;
      }

      theme = {
        point: {
          r: Math.round(primary.r * 0.72 + text.r * 0.28),
          g: Math.round(primary.g * 0.72 + text.g * 0.28),
          b: Math.round(primary.b * 0.72 + text.b * 0.28)
        },
        line: {
          r: Math.round(primary.r * 0.42 + bg.r * 0.58),
          g: Math.round(primary.g * 0.42 + bg.g * 0.58),
          b: Math.round(primary.b * 0.42 + bg.b * 0.58)
        },
        glow: {
          r: Math.round(primary.r * 0.35 + soft.r * 0.65),
          g: Math.round(primary.g * 0.35 + soft.g * 0.65),
          b: Math.round(primary.b * 0.35 + soft.b * 0.65)
        }
      };
    }

    function rgba(color, alpha) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }

    function isReducedMotion() {
      return reducedMotionQuery.matches;
    }

    function currentDensityArea() {
      return isReducedMotion() ? CONFIG.densityAreaReduced : CONFIG.densityArea;
    }

    function currentSpeed() {
      return isReducedMotion() ? CONFIG.speedReduced : CONFIG.speed;
    }

    function currentSteering() {
      return isReducedMotion() ? CONFIG.steeringForceReduced : CONFIG.steeringForce;
    }

    function currentDamping() {
      return isReducedMotion() ? CONFIG.dampingReduced : CONFIG.damping;
    }

    function currentIdleFluxPerMinute() {
      return isReducedMotion() ? CONFIG.idleFluxPerMinuteReduced : CONFIG.idleFluxPerMinute;
    }

    function resizeCanvas() {
      const rect = section.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function rebuildParticleMap() {
      particleById = new Map(particles.map(p => [p.id, p]));
    }

    function getTargetParticleCount() {
      const byArea = Math.round((width * height) / currentDensityArea());
      return clamp(byArea, CONFIG.minParticles, CONFIG.maxParticles);
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function springCountForParticle(id) {
      let count = 0;
      for (const spring of springs) {
        if (spring.a === id || spring.b === id) count++;
      }
      return count;
    }

    function hasSpring(aId, bId) {
      for (const spring of springs) {
        if (
          (spring.a === aId && spring.b === bId) ||
          (spring.a === bId && spring.b === aId)
        ) return true;
      }
      return false;
    }

    function createParticle({ spawning = true, x = random(0, width), y = random(0, height) } = {}) {
      const angle = random(0, Math.PI * 2);
      const now = nowMs();

      return {
        id: nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * random(0.01, 0.06),
        vy: Math.sin(angle) * random(0.01, 0.06),
        ax: 0,
        ay: 0,
        heading: angle,
        targetHeading: angle,
        headingLerp: random(0.003, 0.01),
        headingChangeAt: now + random(CONFIG.headingChangeMinMs, CONFIG.headingChangeMaxMs),
        baseRadius: random(CONFIG.pointRadiusMin, CONFIG.pointRadiusMax),
        mass: random(0.86, 1.3),
        maxLinks: randomInt(CONFIG.minConnectionsPerParticle, CONFIG.maxConnectionsPerParticle),
        status: spawning ? 'spawning' : 'alive',
        lifeStart: now,
        lifeDuration: spawning ? random(CONFIG.spawnDurationMin, CONFIG.spawnDurationMax) : 0,
        protectedUntil: now + CONFIG.recentSpawnProtectionMs,
        dragLocked: false
      };
    }

    function getScale(p, now) {
      if (p.status === 'spawning') {
        const t = clamp((now - p.lifeStart) / p.lifeDuration, 0, 1);
        return easeInOut(t);
      }

      if (p.status === 'despawning') {
        const t = clamp((now - p.lifeStart) / p.lifeDuration, 0, 1);
        return 1 - easeInOut(t);
      }

      return 1;
    }

    function getOpacity(p, now) {
      return clamp(getScale(p, now), 0, 1);
    }

    function addSpring(a, b) {
      if (!a || !b || a.id === b.id) return false;
      if (hasSpring(a.id, b.id)) return false;
      if (springCountForParticle(a.id) >= a.maxLinks) return false;
      if (springCountForParticle(b.id) >= b.maxLinks) return false;

      const dist = distance(a, b);
      if (dist > CONFIG.maxConnectionDistance) return false;

      springs.push({
        a: a.id,
        b: b.id,
        restLength: dist,
        minLength: dist * CONFIG.elasticityMin,
        maxLength: dist * CONFIG.elasticityMax
      });

      return true;
    }

    function buildSpatialGrid() {
      const cellSize = CONFIG.maxConnectionDistance;
      const grid = new Map();

      for (const p of particles) {
        if (p.status === 'despawning') continue;
        const gx = Math.floor(p.x / cellSize);
        const gy = Math.floor(p.y / cellSize);
        const key = `${gx},${gy}`;

        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p);
      }

      return { grid, cellSize };
    }

    function getNearbyParticles(target, spatial) {
      const { grid, cellSize } = spatial;
      const gx = Math.floor(target.x / cellSize);
      const gy = Math.floor(target.y / cellSize);
      const result = [];

      for (let y = gy - 1; y <= gy + 1; y++) {
        for (let x = gx - 1; x <= gx + 1; x++) {
          const key = `${x},${y}`;
          if (grid.has(key)) result.push(...grid.get(key));
        }
      }

      return result;
    }

    function connectNewParticle(p) {
      const spatial = buildSpatialGrid();

      const nearby = getNearbyParticles(p, spatial)
        .filter(other => other.id !== p.id)
        .map(other => ({ other, d: distance(other, p) }))
        .filter(entry => entry.d <= CONFIG.maxConnectionDistance)
        .sort((a, b) => a.d - b.d);

      const desired = randomInt(1, p.maxLinks);

      for (const entry of nearby) {
        if (springCountForParticle(p.id) >= desired) break;
        addSpring(p, entry.other);
      }
    }

    function seedSystem() {
      particles = [];
      springs = [];
      nextParticleId = 1;

      const target = getTargetParticleCount();
      for (let i = 0; i < target; i++) {
        particles.push(createParticle({ spawning: false }));
      }

      rebuildParticleMap();

      for (const particle of particles) {
        connectNewParticle(particle);
      }
    }

    function spawnParticle() {
      const particle = createParticle({ spawning: true });
      particles.push(particle);
      rebuildParticleMap();
      connectNewParticle(particle);
    }

    function chooseParticleToDespawn() {
      const now = nowMs();

      const candidates = particles.filter(p => {
        if (p.status !== 'alive') return false;
        if (p.dragLocked) return false;
        if (now < p.protectedUntil) return false;
        return true;
      });

      if (!candidates.length) return null;
      return candidates[randomInt(0, candidates.length - 1)];
    }

    function despawnParticle() {
      const particle = chooseParticleToDespawn();
      if (!particle) return false;

      particle.status = 'despawning';
      particle.lifeStart = nowMs();
      particle.lifeDuration = random(CONFIG.despawnDurationMin, CONFIG.despawnDurationMax);
      return true;
    }

    function cleanupParticles(now) {
      const removedIds = new Set();

      for (const p of particles) {
        if (p.status === 'spawning') {
          const t = clamp((now - p.lifeStart) / p.lifeDuration, 0, 1);
          if (t >= 1) p.status = 'alive';
        }

        if (p.status === 'despawning') {
          const t = clamp((now - p.lifeStart) / p.lifeDuration, 0, 1);
          if (t >= 1) removedIds.add(p.id);
        }
      }

      if (!removedIds.size) return;

      particles = particles.filter(p => !removedIds.has(p.id));
      springs = springs.filter(s => !removedIds.has(s.a) && !removedIds.has(s.b));
      rebuildParticleMap();
    }

    function scheduleHeadingShift(p, now) {
      if (now < p.headingChangeAt || p.dragLocked) return;

      const deltaDeg = random(CONFIG.headingDeltaMinDeg, CONFIG.headingDeltaMaxDeg) *
        (Math.random() > 0.5 ? 1 : -1);

      p.targetHeading += deltaDeg * Math.PI / 180;
      p.headingChangeAt = now + random(CONFIG.headingChangeMinMs, CONFIG.headingChangeMaxMs);
    }

    function applySelfSteering(p) {
      if (p.dragLocked) return;

      p.heading += shortestAngleDelta(p.heading, p.targetHeading) * p.headingLerp;

      const desiredVX = Math.cos(p.heading) * currentSpeed();
      const desiredVY = Math.sin(p.heading) * currentSpeed();

      p.ax += (desiredVX - p.vx) * currentSteering();
      p.ay += (desiredVY - p.vy) * currentSteering();
    }

    function applyWallRepulsion(p) {
      if (p.x < CONFIG.wallPadding) {
        p.ax += (CONFIG.wallPadding - p.x) * CONFIG.wallForce;
      } else if (p.x > width - CONFIG.wallPadding) {
        p.ax -= (p.x - (width - CONFIG.wallPadding)) * CONFIG.wallForce;
      }

      if (p.y < CONFIG.wallPadding) {
        p.ay += (CONFIG.wallPadding - p.y) * CONFIG.wallForce;
      } else if (p.y > height - CONFIG.wallPadding) {
        p.ay -= (p.y - (height - CONFIG.wallPadding)) * CONFIG.wallForce;
      }
    }

    function applySprings() {
      for (const spring of springs) {
        const a = particleById.get(spring.a);
        const b = particleById.get(spring.b);
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;
        const boundedDist = clamp(dist, spring.minLength, spring.maxLength);
        const stretch = boundedDist - spring.restLength;

        const relVX = b.vx - a.vx;
        const relVY = b.vy - a.vy;
        const relDot = relVX * nx + relVY * ny;

        const force = CONFIG.springK * stretch + CONFIG.springDamping * relDot;
        const fx = force * nx;
        const fy = force * ny;

        if (!a.dragLocked) {
          a.ax += fx / a.mass;
          a.ay += fy / a.mass;
        }

        if (!b.dragLocked) {
          b.ax -= fx / b.mass;
          b.ay -= fy / b.mass;
        }
      }
    }

    function updateParticles(now, dt) {
      for (const p of particles) {
        p.ax = 0;
        p.ay = 0;
        scheduleHeadingShift(p, now);
        applySelfSteering(p);
        applyWallRepulsion(p);
      }

      applySprings();

      for (const p of particles) {
        if (p.dragLocked && dragState?.particleId === p.id) {
          p.x = clamp(dragState.x, 0, width);
          p.y = clamp(dragState.y, 0, height);
          p.vx = dragState.throwVX;
          p.vy = dragState.throwVY;
          continue;
        }

        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.vx *= currentDamping();
        p.vy *= currentDamping();
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.x = clamp(p.x, 0, width);
        p.y = clamp(p.y, 0, height);
      }

      cleanupParticles(now);
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);

      for (const spring of springs) {
        const a = particleById.get(spring.a);
        const b = particleById.get(spring.b);
        if (!a || !b) continue;

        const opacity = Math.min(getOpacity(a, now), getOpacity(b, now));
        const dist = distance(a, b);
        const alphaByDistance = clamp(1 - dist / CONFIG.maxConnectionDistance, 0.04, 1);
        const alpha = CONFIG.opacityLine * alphaByDistance * opacity;

        if (alpha <= 0.003) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = CONFIG.lineWidth;
        ctx.strokeStyle = rgba(theme.line, alpha);
        ctx.stroke();
      }

      for (const p of particles) {
        const scale = getScale(p, now);
        const opacity = getOpacity(p, now);
        const radius = p.baseRadius * scale;

        if (radius <= 0.01) continue;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.7, 0, Math.PI * 2);
        ctx.fillStyle = rgba(theme.glow, CONFIG.opacityGlow * opacity);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(theme.point, CONFIG.opacityPoint * opacity);
        ctx.fill();
      }
    }

    function scheduleIdleFlux() {
      window.clearTimeout(idleTimer);

      const minDelay = isReducedMotion() ? CONFIG.idleMinDelayMs * 1.8 : CONFIG.idleMinDelayMs;
      const maxDelay = isReducedMotion() ? CONFIG.idleMaxDelayMs * 1.8 : CONFIG.idleMaxDelayMs;
      const delay = random(minDelay, maxDelay);

      idleTimer = window.setTimeout(() => {
        const target = getTargetParticleCount();
        const active = particles.filter(p => p.status !== 'despawning').length;
        const driftBudget = Math.max(1, Math.round(currentIdleFluxPerMinute() / 2));

        const shouldAdd =
          active < target ||
          (Math.random() > 0.5 && active < Math.min(CONFIG.maxParticles, target + driftBudget));

        if (shouldAdd) {
          spawnParticle();
        } else if (active > CONFIG.minParticles) {
          despawnParticle();
        }

        scheduleIdleFlux();
      }, delay);
    }

    function processResizeDiff() {
      const target = getTargetParticleCount();
      const active = particles.filter(p => p.status !== 'despawning').length;

      if (active < target && pendingAdds > 0) {
        spawnParticle();
        pendingAdds--;
        return true;
      }

      if (active > target && pendingRemovals > 0) {
        if (despawnParticle()) pendingRemovals--;
        return true;
      }

      if (pendingAdds > 0) {
        spawnParticle();
        pendingAdds--;
        return true;
      }

      if (pendingRemovals > 0) {
        if (despawnParticle()) pendingRemovals--;
        return true;
      }

      return false;
    }

    function scheduleResizeAdjustments() {
      const target = getTargetParticleCount();
      const current = particles.filter(p => p.status !== 'despawning').length;
      const diff = target - current;

      pendingAdds = diff > 0 ? diff : 0;
      pendingRemovals = diff < 0 ? Math.abs(diff) : 0;

      resizePlanId += 1;
      const planId = resizePlanId;
      const jobs = pendingAdds + pendingRemovals;
      if (!jobs) return;

      let elapsed = 0;

      const step = () => {
        if (planId !== resizePlanId) return;
        if (!processResizeDiff()) return;
        if (pendingAdds <= 0 && pendingRemovals <= 0) return;

        const remainingJobs = pendingAdds + pendingRemovals;
        const remainingBudget = Math.max(0, CONFIG.resizeBudgetMs - elapsed);
        const dynamicMax = Math.max(
          CONFIG.resizeMinDelayMs,
          Math.min(CONFIG.resizeMaxDelayMs, remainingBudget / Math.max(1, remainingJobs))
        );

        const delay = clamp(
          random(CONFIG.resizeMinDelayMs, dynamicMax),
          CONFIG.resizeMinDelayMs,
          CONFIG.resizeMaxDelayMs
        );

        elapsed += delay;
        window.setTimeout(step, delay);
      };

      step();
    }

    function handleResize() {
      resizeCanvas();

      for (const p of particles) {
        p.x = clamp(p.x, 0, width);
        p.y = clamp(p.y, 0, height);
      }

      scheduleResizeAdjustments();
    }

    function pointerPosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function findParticleAt(x, y) {
      let best = null;
      let bestDist = Infinity;
      const now = nowMs();

      for (const p of particles) {
        if (p.status === 'despawning') continue;

        const scale = getScale(p, now);
        const radius = Math.max(CONFIG.pointDragRadius, p.baseRadius * scale * 3.5);
        const dist = Math.hypot(p.x - x, p.y - y);

        if (dist < radius && dist < bestDist) {
          best = p;
          bestDist = dist;
        }
      }

      return best;
    }

    if (CONFIG.interactive) {
      canvas.addEventListener('pointerdown', event => {
        const pos = pointerPosition(event);
        const particle = findParticleAt(pos.x, pos.y);
        if (!particle) return;

        canvas.setPointerCapture(event.pointerId);
        particle.dragLocked = true;

        dragState = {
          particleId: particle.id,
          x: pos.x,
          y: pos.y,
          prevX: pos.x,
          prevY: pos.y,
          prevT: nowMs(),
          throwVX: 0,
          throwVY: 0,
          pointerId: event.pointerId
        };
      });

      canvas.addEventListener('pointermove', event => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        const t = nowMs();
        const pos = pointerPosition(event);
        const dt = Math.max(16, t - dragState.prevT);
        const vx = (pos.x - dragState.prevX) / dt;
        const vy = (pos.y - dragState.prevY) / dt;

        dragState.throwVX = vx * 60 * CONFIG.dragImpulseScale;
        dragState.throwVY = vy * 60 * CONFIG.dragImpulseScale;
        dragState.x = pos.x;
        dragState.y = pos.y;
        dragState.prevX = pos.x;
        dragState.prevY = pos.y;
        dragState.prevT = t;
      });

      function releasePointer(event) {
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        const particle = particleById.get(dragState.particleId);
        if (particle) {
          particle.dragLocked = false;
          particle.vx = dragState.throwVX;
          particle.vy = dragState.throwVY;
        }

        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }

        dragState = null;
      }

      canvas.addEventListener('pointerup', releasePointer);
      canvas.addEventListener('pointercancel', releasePointer);
    }

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, CONFIG.resizeDebounceMs);
    });

    const themeObserver = new MutationObserver(() => {
      refreshTheme();
    });

    reducedMotionQuery.addEventListener?.('change', () => {
      scheduleIdleFlux();
      scheduleResizeAdjustments();
    });

    function animate(time) {
      if (!lastTime) lastTime = time;
      const dt = Math.min((time - lastTime) / 16.666, 1.6);
      lastTime = time;

      rebuildParticleMap();
      updateParticles(time, dt);
      draw(time);

      rafId = requestAnimationFrame(animate);
    }

    refreshTheme();
    resizeCanvas();
    seedSystem();
    resizeObserver.observe(section);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class']
    });

    scheduleIdleFlux();
    rafId = requestAnimationFrame(animate);

    window.addEventListener('beforeunload', () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(idleTimer);
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    });
  }

  initNetworkCanvas('.hero', '.hero-network', {
    interactive: true,
    deriveForDarkSurface: false,
    densityArea: 20000,
    densityAreaReduced: 24000,
    opacityPoint: 0.58,
    opacityLine: 0.26,
    opacityGlow: 0.12,
    maxConnectionDistance: 240,
    lineWidth: 0.85
  });

  initNetworkCanvas('.accent-block', '.accent-network', {
    interactive: false,
    deriveForDarkSurface: true,
    densityArea: 26000,
    densityAreaReduced: 32000,
    minParticles: 10,
    maxParticles: 40,
    opacityPoint: 0.32,
    opacityLine: 0.16,
    opacityGlow: 0.07,
    pointRadiusMin: 1.0,
    pointRadiusMax: 2.3,
    lineWidth: 0.7,
    speed: 0.012,
    speedReduced: 0.007,
    steeringForce: 0.0012,
    steeringForceReduced: 0.0008,
    maxConnectionDistance: 180,
    wallPadding: 32,
    idleFluxPerMinute: 1.2,
    idleFluxPerMinuteReduced: 0.5
  });
})();
