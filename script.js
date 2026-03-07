/* ════════════════════════════════════════════════════════════════
   ALTHEAS STUDIOS — script.js
   Architecture:
     1. fetch() loads each section from sections/*.html
     2. Fragments are injected into #app in order
     3. i18n, scroll animations, counters, navbar init run after assembly

   ⚠️  Requires a local HTTP server (e.g. VS Code Live Server).
       fetch() does NOT work over file:// protocol.
   ════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Section load order ────────────────────────────────────── */
const SECTIONS = [
  'sections/navbar.html',
  'sections/hero.html',
  'sections/about.html',
  'sections/products.html',
  'sections/music.html',
  'sections/team.html',
  'sections/contact.html',
  'sections/footer.html',
];

/* ─── Translations (populated by locales/*.js) ──────────────── */
const i18n = window.Locales || {};

/* ════════════════════════════════════════════════════════════════
   ASSEMBLY — fetch all section fragments → inject into #app
   ════════════════════════════════════════════════════════════════ */
async function assemblePage() {
  const app = document.getElementById('app');

  try {
    // Fetch all sections in parallel, preserve order
    const htmlParts = await Promise.all(
      SECTIONS.map(url =>
        fetch(url).then(res => {
          if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
          return res.text();
        })
      )
    );

    // Replace loader with assembled content
    app.innerHTML = htmlParts.join('\n');

    // Boot the app once DOM is ready
    initApp();

  } catch (err) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100vh;font-family:sans-serif;color:#0e7490;text-align:center;padding:24px">
        <div style="font-size:2rem;font-weight:700;margin-bottom:12px">⚠ Could not load sections</div>
        <p style="color:#5b9aaa;max-width:480px">
          This site uses <strong>fetch()</strong> to load HTML partials and requires a local server.<br><br>
          Open with <strong>VS Code Live Server</strong> (right-click <code>index.html</code> → Open with Live Server).
        </p>
        <pre style="margin-top:20px;background:#e0f7fa;padding:12px 20px;border-radius:8px;
                    font-size:0.82rem;color:#155e75">${err.message}</pre>
      </div>`;
  }
}

/* ════════════════════════════════════════════════════════════════
   APP INIT — runs after all sections are in the DOM
   ════════════════════════════════════════════════════════════════ */
function initApp() {
  const savedLang = localStorage.getItem('ur_lang') || 'en';
  initI18n(savedLang);
  initNavbar();
  initScrollAnimations();
  initCounters();
  initSmoothScroll();
}

/* ════════════════════════════════════════════════════════════════
   I18N
   ════════════════════════════════════════════════════════════════ */
let currentLang = 'en';

function initI18n(lang) {
  currentLang = lang;
  const t = i18n[lang];
  if (!t) { console.warn(`Locale "${lang}" not found.`); return; }

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Placeholder attributes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
  });

  document.documentElement.lang = lang;
  localStorage.setItem('ur_lang', lang);

  // Active lang button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

/* ════════════════════════════════════════════════════════════════
   NAVBAR
   ════════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-links');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Active link tracking
  const sections = document.querySelectorAll('.section');
  const navLinks  = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => sectionObserver.observe(s));

  // Lang switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => initI18n(btn.dataset.lang));
  });

  // Hamburger
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
  });
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS
   ════════════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  const items = document.querySelectorAll('.animate-item');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.remove('exit-up');
      } else {
        const rect = entry.boundingClientRect;
        if (rect.bottom < 0) {
          // Scrolled off the top → fade out upward
          entry.target.classList.add('exit-up');
          entry.target.classList.remove('visible');
        } else {
          // Below viewport → reset to come-in-from-below state
          entry.target.classList.remove('visible', 'exit-up');
        }
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════════════
   ANIMATED COUNTERS
   ════════════════════════════════════════════════════════════════ */
function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let current  = 0;
      const step   = Math.max(1, Math.floor(target / 40));
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + suffix;
        if (current >= target) clearInterval(timer);
      }, 40);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════════════
   SMOOTH SCROLL
   ════════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = (document.getElementById('navbar')?.offsetHeight || 0) + 8;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════════════════════════════ */
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const successEl = document.getElementById('form-success');
  const btn = form.querySelector('button[type="submit"]');
  const t = i18n[currentLang] || {};

  const FORMSPREE_ID = 'xykngooo';

  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form),
    });

    if (res.ok) {
      successEl.textContent = t.form_success || '✓ Message sent!';
      successEl.style.color = '';
      successEl.classList.add('show');
      form.reset();
      setTimeout(() => successEl.classList.remove('show'), 5000);
    } else {
      successEl.textContent = '✗ Gönderim başarısız, tekrar deneyin.';
      successEl.style.color = '#f87171';
      successEl.classList.add('show');
      setTimeout(() => successEl.classList.remove('show'), 5000);
    }
  } catch {
    successEl.textContent = '✗ Bağlantı hatası.';
    successEl.style.color = '#f87171';
    successEl.classList.add('show');
    setTimeout(() => successEl.classList.remove('show'), 5000);
  } finally {
    btn.disabled = false;
    btn.textContent = t.form_send || 'Send Message';
  }
}

/* ════════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════════ */
assemblePage();
