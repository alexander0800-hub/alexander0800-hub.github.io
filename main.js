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

  // Purchase: payment details appear only after all consents
  const form = $('#buy-form');
  const btc = $('#btc-box');
  if (form && btc) {
    const LABEL = { home: 'Home – 330 Kč / 17 €', commercial: 'Commercial – 3 300 Kč / 170 €' };
    const status = $('#buy-status');
    const mail = $('#btc-mail');
    const mailBase = mail.getAttribute('href').split('?')[0];
    const update = () => {
      const licence = form.elements.licence.value;
      const ok = $$('input[type="checkbox"]', form).every((c) => c.checked);
      btc.hidden = !ok;
      $('#btc-licence').textContent = LABEL[licence];
      const subject = `ClovicekHD - platba BTC - licence ${licence === 'home' ? 'Home' : 'Commercial'}`;
      const body = 'txid: \nTyp licence: ' + LABEL[licence] + '\nE-mail pro zaslání klíče: \n';
      mail.href = `${mailBase}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = ok ? 'Souhlasy potvrzeny. Platební údaje najdete níže.' : 'Po potvrzení všech souhlasů se zobrazí platební údaje.';
      status.classList.toggle('ok', ok);
    };
    form.addEventListener('change', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    $$('a[data-licence]').forEach((a) => a.addEventListener('click', () => {
      const r = form.querySelector(`input[value="${a.dataset.licence}"]`);
      if (r) { r.checked = true; update(); }
    }));
    update();
  }

  // Copy BTC address
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = $(b.dataset.copy).textContent.trim();
    try { await navigator.clipboard.writeText(text); b.textContent = 'Zkopírováno'; }
    catch { b.textContent = 'Označte a zkopírujte ručně'; }
    setTimeout(() => { b.textContent = 'Kopírovat'; }, 2500);
  }));
})();
