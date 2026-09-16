// AlexanderSoft web – menu, reveal, lightbox, purchase consents. No cookies, no storage, no network.
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
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Disabled links (demo coming soon) do nothing but stay focusable
  $$('a[aria-disabled="true"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $('#demo');
    e.preventDefault();
    if (target && a.getAttribute('href') === '#demo') target.scrollIntoView({ behavior: 'smooth' });
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
})();
