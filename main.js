// AlexanderSoft web – menu, reveal, lightbox, mode switch, sticky call-to-action, inquiry and interest forms.
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
    $$('.gallery-grid a, .model-grid a').forEach((a) => a.addEventListener('click', (e) => {
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

  // Accessible form validation: messages in the page language (data-err-* on the form), linked to each field
  // via aria-describedby and aria-invalid, focus moves to the first invalid field. The browser's own bubbles
  // (in the browser's language, not linked to the field) are switched off only when this script runs.
  const setError = (form, el, text) => {
    const id = el.id + '-chyba';
    let msg = document.getElementById(id);
    const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== id);
    if (text) {
      if (!msg) {
        msg = document.createElement('p');
        msg.id = id;
        msg.className = 'field-error';
        const row = el.closest('.form-row');
        if (row) row.appendChild(msg); else (el.closest('label') || el).after(msg);
      }
      msg.textContent = text;
      el.setAttribute('aria-invalid', 'true');
      ids.push(id);
    } else {
      if (msg) msg.remove();
      el.removeAttribute('aria-invalid');
    }
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  };
  const fieldError = (form, el) => {
    if (el.checkValidity()) return '';
    if (el.type === 'checkbox') return form.dataset.errConsent;
    return el.validity.typeMismatch ? form.dataset.errEmail : form.dataset.errRequired;
  };
  const fields = (form) => $$('input, select, textarea', form).filter((el) => el.willValidate && el.id && !el.closest('.form-row-hp'));
  const checkForm = (form) => {
    if (!form.dataset.errRequired) return form.reportValidity();
    let first = null;
    fields(form).forEach((el) => {
      const text = fieldError(form, el);
      setError(form, el, text);
      if (text && !first) first = el;
    });
    if (first) { first.focus(); return false; }
    return true;
  };
  $$('form[data-err-required]').forEach((form) => {
    form.noValidate = true;
    // Once a field has been flagged, keep its message in sync while the visitor fixes it.
    const recheck = (e) => { const el = e.target; if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') setError(form, el, fieldError(form, el)); };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);
  });
  // While sending, the submit button is marked aria-disabled instead of disabled, so keyboard focus stays on it.
  const busy = (form, btn, on) => {
    if (on) { btn.setAttribute('aria-disabled', 'true'); form.setAttribute('aria-busy', 'true'); }
    else { btn.removeAttribute('aria-disabled'); form.removeAttribute('aria-busy'); }
  };

  // Software inquiry form ("nezávazná poptávka") -> Cloudflare Worker.
  const poptavka = $('#poptavka-form');
  if (poptavka) {
    const status = $('#poptavka-status', poptavka);
    const btn = $('button[type="submit"]', poptavka);
    poptavka.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      if (!checkForm(poptavka)) return;
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
      busy(poptavka, btn, true);
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
      }).finally(() => busy(poptavka, btn, false));
    });
  }

  // Sticky call-to-action bar (phones only, CSS shows it below 760 px): visible once the hero is scrolled away,
  // hidden again while another call to action (hero, form, band) or the footer is on screen.
  const sticky = $('#sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    const watch = ['.hero', '#zajem', '#pas-vyzva', '.site-footer'].map((q) => $(q)).filter(Boolean);
    const seen = new Set();
    const sw = $('#rezim-software');
    const update = () => { sticky.hidden = seen.size > 0 || window.scrollY < 200 || !!(sw && sw.checked); };
    $$('input[name="rezim"]').forEach((r) => r.addEventListener('change', update));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      update();
    });
    watch.forEach((el) => io.observe(el));
    window.addEventListener('scroll', update, { passive: true });
  }

  // Interest form (beta test / release notification): rendered only when the build has it enabled (site/zajem.json).
  // The two hero buttons preselect the choice; the form itself is inside the Hry panel, so make sure that panel is shown.
  const zajem = $('#zajem-form');
  if (zajem) {
    const status = $('#zajem-status', zajem);
    const btn = $('button[type="submit"]', zajem);
    let zdroj = 'primo';
    const showGames = () => {
      const r = $('#rezim-hry');
      if (r && !r.checked) { r.checked = true; try { localStorage.setItem('as-rezim', 'hry'); } catch (e) { /* private mode etc. */ } }
    };
    $$('[data-zajem]').forEach((a) => a.addEventListener('click', () => {
      showGames();
      zdroj = a.dataset.zdroj || ('hero-' + a.dataset.zajem);
      const radio = $(`input[name="typ"][value="${a.dataset.zajem}"]`, zajem);
      if (radio) radio.checked = true;
    }));
    if (location.hash === '#zajem') showGames();
    zajem.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      if (!checkForm(zajem)) return;
      const fd = new FormData(zajem);
      const payload = {
        email: fd.get('email') || '',
        jazyk: fd.get('jazyk') || '',
        typ: fd.get('typ') || 'beta',
        stranka: document.documentElement.lang || '',
        zdroj,
        souhlas: !!fd.get('souhlas'),
        souhlasVerze: 'zajem-2026-09-23',
        hp: fd.get('hp') || '',
      };
      busy(zajem, btn, true);
      status.classList.remove('ok');
      status.textContent = zajem.dataset.sending;
      // text/plain: "simple" content-type, no CORS preflight (same as the inquiry form).
      fetch(zajem.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) { status.textContent = (data && data.zprava) || zajem.dataset.error; return; }
          status.textContent = zajem.dataset.success;
          status.classList.add('ok');
          zajem.reset();
        })
        .catch(() => { status.textContent = zajem.dataset.error; })
        .finally(() => busy(zajem, btn, false));
    });
  }

  // Klub AlexanderSoft "brzy" signup (site/klub.json formReady): same pattern as the zajem form above,
  // just e-mail + consent (+ Turnstile once CEO deploys the sitekey). Rendered only when formReady is on.
  const klub = $('#klub-form');
  if (klub) {
    const status = $('#klub-status', klub);
    const btn = $('button[type="submit"]', klub);
    klub.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      if (!checkForm(klub)) return;
      const fd = new FormData(klub);
      const payload = {
        email: fd.get('email') || '',
        stranka: document.documentElement.lang || '',
        souhlas: !!fd.get('souhlas'),
        souhlasVerze: 'klub-2026-09-28',
        hp: fd.get('hp') || '',
        turnstile: fd.get('cf-turnstile-response') || '',
      };
      busy(klub, btn, true);
      status.classList.remove('ok');
      status.textContent = klub.dataset.sending;
      fetch(klub.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) { status.textContent = (data && data.zprava) || klub.dataset.error; return; }
          status.textContent = klub.dataset.success;
          status.classList.add('ok');
          klub.reset();
        })
        .catch(() => { status.textContent = klub.dataset.error; })
        .finally(() => busy(klub, btn, false));
    });
  }
})();
