// AlexanderSoft web – menu, reveal, lightbox, purchase consents, mode switch, inquiry form.
// No tracking cookies. Only optional storage: remembering the Hry/Software choice (localStorage).
// Only network call: the inquiry form POSTs to the Worker, and only when the visitor submits it.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobile menu
  const toggle = $('.nav-toggle');
  const nav = $('#hlavni-menu');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
      const inside = nav.contains(document.activeElement);
      setOpen(false);
      if (inside) toggle.focus(); // WCAG 2.4.3: focus must not stay in a hidden menu
    });
  }

  // Disabled links (demo coming soon) do nothing but stay focusable
  $$('a[aria-disabled="true"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $('#demo');
    e.preventDefault();
    if (target && a.getAttribute('href') === '#demo') target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));

  // Reveal on scroll
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Lightbox
  const box = $('#lightbox');
  if (box) {
    const img = $('img', box);
    const close = $('button', box);
    let opener = null;
    const hide = () => { box.hidden = true; img.removeAttribute('src'); if (opener) opener.focus(); };
    $$('.gallery-grid a').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      opener = a;
      img.src = a.getAttribute('href');
      img.alt = $('img', a).alt;
      box.hidden = false;
      close.focus();
    }));
    close.addEventListener('click', hide);
    box.addEventListener('click', (e) => { if (e.target === box) hide(); });
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
    });
  }

  // Purchase form and BTC copy button were removed until sales start (old code: _nepouzite/main_js_nakup_formular_v0.js).

  // Mode switch (Hry/Software): CSS :has() drives the toggle itself; this only remembers the choice
  // and, for people who arrived via the "Software" nav link (#software/#poptavka), keeps the tab UI in sync.
  $$('input[name="rezim"]').forEach((r) => r.addEventListener('change', () => {
    if (!r.checked) return;
    try { localStorage.setItem('as-rezim', r.id === 'rezim-software' ? 'software' : 'hry'); } catch (e) { /* private mode etc. */ }
  }));
  if (location.hash === '#software' || location.hash === '#poptavka') {
    const swRadio = $('#rezim-software');
    if (swRadio) swRadio.checked = true;
  }

  // Software inquiry form ("nezávazná poptávka") -> Cloudflare Worker.
  const poptavka = $('#poptavka-form');
  if (poptavka) {
    const status = $('#poptavka-status', poptavka);
    const btn = $('button[type="submit"]', poptavka);
    poptavka.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!poptavka.reportValidity()) return;
      const fd = new FormData(poptavka);
      const payload = {
        jmeno: fd.get('jmeno') || '',
        email: fd.get('email') || '',
        typ: fd.get('typ') || '',
        popis: fd.get('popis') || '',
        rozpocet: fd.get('rozpocet') || '',
        termin: fd.get('termin') || '',
        jazyk: document.documentElement.lang || '',
        souhlas: !!fd.get('souhlas'),
        hp: fd.get('hp') || '',
      };
      btn.disabled = true;
      status.textContent = poptavka.dataset.sending;
      // text/plain (not application/json): the Worker still reads it as JSON, but a "simple" content-type
      // avoids a CORS preflight (OPTIONS) request for this cross-origin POST.
      fetch('https://beta-portal.boss-05d.workers.dev/api/poptavka', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) { status.textContent = (data && data.zprava) || poptavka.dataset.error; return; }
        status.textContent = poptavka.dataset.success;
        poptavka.reset();
      }).catch(() => {
        status.textContent = poptavka.dataset.error;
      }).finally(() => { btn.disabled = false; });
    });
  }
})();
