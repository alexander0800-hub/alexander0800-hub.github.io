// Neveřejná sekce pro betatestery. Skript jen posílá a vykresluje data.
// Žádné ověřování hesla ani kódu tady není: o to se stará Worker na /api/* (zadání CEO 18. 9. 2026).
// Data ze serveru vkládáme přes textContent, nikdy přes innerHTML – hlášení píšou testeři.
(function () {
  'use strict';
  var T = window.BETA_TEXTY || {};
  var API = window.BETA_API || '/api';

  /* ---------- motiv (světlý / tmavý / podle systému) ---------- */
  var KLIC = 'beta-motiv';
  function nastavMotiv(v) {
    if (v === 'svetly' || v === 'tmavy') document.documentElement.setAttribute('data-motiv', v);
    else document.documentElement.removeAttribute('data-motiv');
    try { v ? localStorage.setItem(KLIC, v) : localStorage.removeItem(KLIC); } catch (e) { /* soukromé okno */ }
  }
  var prepinac = document.getElementById('motiv');
  if (prepinac) {
    var ulozeny = '';
    try { ulozeny = localStorage.getItem(KLIC) || ''; } catch (e) { ulozeny = ''; }
    prepinac.value = ulozeny || 'system';
    if (ulozeny) nastavMotiv(ulozeny);
    prepinac.addEventListener('change', function () {
      nastavMotiv(prepinac.value === 'system' ? '' : prepinac.value);
    });
  }

  /* ---------- pomocníci ---------- */
  function el(tag, text, atr) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (atr) for (var k in atr) if (atr[k] != null) e.setAttribute(k, atr[k]);
    return e;
  }
  function hlaska(uzel, text, druh) {
    if (!uzel) return;
    uzel.textContent = text || '';
    uzel.className = 'hlaska' + (text ? ' ' + (druh || 'chyba') : '');
  }
  function api(cesta, data) {
    var opt = { credentials: 'same-origin', headers: { 'accept': 'application/json' } };
    if (data) {
      opt.method = 'POST';
      opt.headers['content-type'] = 'application/json';
      opt.body = JSON.stringify(data);
    }
    return fetch(API + cesta, opt).then(function (r) {
      if (r.status === 401 || r.status === 403) { var e = new Error('401'); e.neprihlasen = true; throw e; }
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e2 = new Error(j.chyba || String(r.status)); e2.data = j; throw e2; }
        return j;
      });
    });
  }
  function textChyby(err) {
    if (err && err.neprihlasen) return T.obecne.chybaPrihlaseni;
    return (err && err.data && err.data.zprava) || T.obecne.chybaSite;
  }
  function beziciTlacitko(btn, bezi, textBezi) {
    if (!btn) return;
    if (bezi) { btn.dataset.puvodni = btn.textContent; btn.textContent = textBezi; btn.disabled = true; }
    else { btn.textContent = btn.dataset.puvodni || btn.textContent; btn.disabled = false; }
  }
  // koren = formulář nebo jen jeden krok formuláře
  function overPovinna(koren) {
    var chybne = [], skupiny = {};
    Array.prototype.forEach.call(koren.querySelectorAll('[required]'), function (p) {
      if (p.type === 'radio') {
        if (skupiny[p.name]) return;
        skupiny[p.name] = true;
        var vybrano = !!koren.querySelector('input[name="' + p.name + '"]:checked');
        var mch = document.getElementById(p.name + '-chyba');
        if (mch) mch.textContent = vybrano ? '' : T.obecne.chybaPole;
        if (!vybrano) chybne.push(koren.querySelector('input[name="' + p.name + '"]'));
        return;
      }
      var prazdne = !String(p.value || '').trim();
      p.setAttribute('aria-invalid', prazdne ? 'true' : 'false');
      var mistoChyby = document.getElementById(p.id + '-chyba');
      if (mistoChyby) mistoChyby.textContent = prazdne ? T.obecne.chybaPole : '';
      if (prazdne) chybne.push(p);
    });
    if (chybne.length) chybne[0].focus();
    return chybne.length === 0;
  }

  var stranka = document.body.getAttribute('data-stranka');

  /* ---------- odhlášení (na každé stránce po přihlášení) ---------- */
  var odhlasit = document.getElementById('odhlasit');
  if (odhlasit) odhlasit.addEventListener('click', function (e) {
    e.preventDefault();
    api('/odhlasit', {}).catch(function () { /* i tak pryč */ }).then(function () {
      location.href = odhlasit.getAttribute('data-cil');
    });
  });

  /* ---------- přihlášení ---------- */
  if (stranka === 'prihlaseni') {
    var fp = document.getElementById('form-prihlaseni');
    var hp = document.getElementById('hlaska');
    // Osm marných pokusů a formulář se na hodinu zavře. Je to jen první zábrana pro daný prohlížeč;
    // závazně počítá pokusy Worker (429), tohle mu jen ubere práci a testerovi řekne, co se děje.
    var POKUSY = 8, HODINA = 3600000, KLIC_P = 'beta-pokusy';
    function stavPokusu() {
      try { return JSON.parse(localStorage.getItem(KLIC_P) || '{}'); } catch (e) { return {}; }
    }
    function ulozPokusy(s) { try { localStorage.setItem(KLIC_P, JSON.stringify(s)); } catch (e) { /* soukromé okno */ } }
    function zamceno() {
      var s = stavPokusu();
      if (!s.do || Date.now() > s.do) { if (s.do) ulozPokusy({}); return false; }
      return (s.n || 0) >= POKUSY;
    }
    function zavri() {
      Array.prototype.forEach.call(fp.elements, function (p) { p.disabled = true; });
      hlaska(hp, T.prihlaseni.zamek);
    }
    if (zamceno()) zavri();
    fp.addEventListener('submit', function (e) {
      e.preventDefault();
      if (zamceno()) { zavri(); return; }
      if (!overPovinna(fp)) { hlaska(hp, T.prihlaseni.chybaPrazdne); return; }
      var btn = fp.querySelector('button[type="submit"]');
      hlaska(hp, '');
      beziciTlacitko(btn, true, T.prihlaseni.odesilam);
      api('/login', { email: fp.email.value.trim(), kod: fp.kod.value })
        .then(function (r) {
          ulozPokusy({});
          hlaska(hp, T.prihlaseni.uspech, 'ok');
          location.href = r.dalsi || fp.getAttribute('data-cil');
        })
        .catch(function (err) {
          beziciTlacitko(btn, false);
          fp.kod.value = '';
          if (err && err.neprihlasen) {
            var s = stavPokusu();
            var n = (s.do && Date.now() <= s.do ? (s.n || 0) : 0) + 1;
            ulozPokusy({ n: n, do: Date.now() + HODINA });
            if (n >= POKUSY) { zavri(); return; }
            hlaska(hp, T.prihlaseni.chybaUdaje + ' ' + T.prihlaseni.zbyva + (POKUSY - n));
          } else {
            hlaska(hp, textChyby(err));
          }
          fp.kod.focus();
        });
    });
  }

  /* ---------- nastavení hesla z pozvánky ---------- */
  // Pravidla jsou tu jen kvůli rychlé zpětné vazbě; závazně je ověřuje Worker (POST /api/heslo).
  if (stranka === 'heslo') {
    var fh2 = document.getElementById('form-heslo');
    var hh2 = document.getElementById('hlaska');
    var token = new URLSearchParams(location.search).get('t') || '';
    // Bez tokenu formulář nezakazujeme (zmizel by z pořadí Tab), jen hlásíme a odeslání zastavíme.
    if (!token) hlaska(hh2, T.heslo.chybaToken);
    // přepnutí jazyka nesmí ztratit token z pozvánky
    Array.prototype.forEach.call(document.querySelectorAll('.nastroje a[href*="heslo.html"]'), function (a) {
      a.href = a.getAttribute('href') + location.search;
    });
    var ukaz = document.getElementById('ukazat');
    if (ukaz) ukaz.addEventListener('change', function () {
      var typ = ukaz.checked ? 'text' : 'password';
      fh2.heslo.type = typ;
      fh2.potvrzeni.type = typ;
    });
    function potizHesla(h) {
      if (h.length < 12) return T.heslo.chybaKratke;
      if (!/\p{L}/u.test(h)) return T.heslo.chybaPismeno;
      if (!/\p{Nd}/u.test(h)) return T.heslo.chybaCislice;
      if (!/[^\p{L}\p{Nd}]/u.test(h)) return T.heslo.chybaSpecialni;
      return '';
    }
    fh2.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!token) { hlaska(hh2, T.heslo.chybaToken); return; }
      if (!overPovinna(fh2)) { hlaska(hh2, T.hlaseni.chybaPovinne); return; }
      var potiz = potizHesla(fh2.heslo.value);
      var poleChyba = document.getElementById('heslo-chyba');
      var poleChyba2 = document.getElementById('potvrzeni-chyba');
      poleChyba.textContent = potiz;
      fh2.heslo.setAttribute('aria-invalid', potiz ? 'true' : 'false');
      if (potiz) { hlaska(hh2, potiz); fh2.heslo.focus(); return; }
      if (fh2.heslo.value !== fh2.potvrzeni.value) {
        poleChyba2.textContent = T.heslo.chybaNeshoda;
        fh2.potvrzeni.setAttribute('aria-invalid', 'true');
        hlaska(hh2, T.heslo.chybaNeshoda);
        fh2.potvrzeni.focus();
        return;
      }
      poleChyba2.textContent = '';
      fh2.potvrzeni.setAttribute('aria-invalid', 'false');
      var btn2 = fh2.querySelector('button[type="submit"]');
      hlaska(hh2, '');
      beziciTlacitko(btn2, true, T.heslo.odesilam);
      api('/heslo', { token: token, heslo: fh2.heslo.value })
        .then(function (r) {
          fh2.reset();
          fh2.hidden = true;
          hlaska(hh2, T.heslo.uspech, 'ok');
          location.href = r.dalsi || fh2.getAttribute('data-cil');
        })
        .catch(function (err) {
          beziciTlacitko(btn2, false);
          hlaska(hh2, err && err.neprihlasen ? T.heslo.chybaToken : textChyby(err));
        });
    });
  }

  /* ---------- seznam testovacích verzí ---------- */
  if (stranka === 'buildy') {
    var telo = document.getElementById('buildy-telo');
    var hb = document.getElementById('hlaska');
    var sl = T.buildy.sloupce;
    var obnovit = document.getElementById('obnovit');
    // Odkazy ke stažení platí 5 minut, takže musí jít seznam načíst znovu bez opuštění stránky.
    if (obnovit) obnovit.addEventListener('click', function () { hlaska(hb, T.obecne.nacitam, 'ok'); nactiBuildy(); });
    function nactiBuildy() {
    api('/buildy').then(function (r) {
      var polozky = (r && r.buildy) || [];
      telo.textContent = '';
      document.getElementById('buildy-tabulka').hidden = false;
      hlaska(hb, '');
      if (!polozky.length) {
        document.getElementById('buildy-tabulka').hidden = true;
        hlaska(hb, T.buildy.prazdne, 'ok');
        return;
      }
      polozky.forEach(function (b) {
        var tr = el('tr');
        [[sl.verze, b.verze], [sl.platforma, b.platforma], [sl.datum, b.datum],
         [sl.velikost, b.velikost], [sl.poznamka, b.poznamka]].forEach(function (p) {
          tr.appendChild(el('td', p[1] || '–', { 'data-popis': p[0] }));
        });
        var td = el('td', null, { 'data-popis': sl.akce });
        if (b.odkaz) {
          var a = el('a', T.buildy.stahnout, { href: b.odkaz, class: 'tlacitko mala', rel: 'nofollow' });
          if (b.soubor) a.setAttribute('download', b.soubor);
          td.appendChild(a);
        }
        if (b.sha256) {
          td.appendChild(el('span', T.buildy.kontrolniSoucet, { class: 'vizualne-skryte' }));
          td.appendChild(el('code', b.sha256));
        }
        tr.appendChild(td);
        telo.appendChild(tr);
      });
    }).catch(function (err) {
      hlaska(hb, textChyby(err));
      if (err && err.neprihlasen) setTimeout(function () { location.href = telo.getAttribute('data-prihlaseni'); }, 1500);
    });
    }
    nactiBuildy();
  }

  /* ---------- hlášení chyby ---------- */
  if (stranka === 'hlaseni') {
    var fh = document.getElementById('form-hlaseni');
    var hh = document.getElementById('hlaska');
    var sys = document.getElementById('system');
    if (sys && !sys.value) sys.value = navigator.userAgent || '';
    // Výkonový profil: hra ho zapisuje pod 'p4k.beta.profil' jako 'normalni' | 'nizky' (dohoda s P4K 18. 9.),
    // Worker přijímá české hodnoty – tady je jediné místo převodu. Když hra nic nezapsala, zůstane „Nevím“;
    // do vydání 1.0 nezapisuje vůbec a prázdno tedy NENÍ chyba formuláře (potvrdil CEO 18. 9.).
    var PROFIL_CESKY = { normalni: 'Normální', nizky: 'Nízký', nevim: 'Nevím' };
    var profilCas = '';
    try {
      var zHry = PROFIL_CESKY[String(localStorage.getItem('p4k.beta.profil') || '').toLowerCase()];
      var volba = zHry && fh.querySelector('input[name="profil"][value="' + zHry + '"]');
      if (volba) {
        volba.checked = true;
        var np = document.getElementById('profil-napoveda');
        if (np) np.textContent = T.hlaseni.profilAuto;
      }
      // Za jak dlouho se profil přepnul: ve třetí sekundě = slabé zařízení, ve dvacáté minutě = přehřátí.
      var cas = parseInt(localStorage.getItem('p4k.beta.profil_cas'), 10);
      if (cas >= 0 && cas <= 86400) profilCas = String(cas);
    } catch (e) { /* zakázané úložiště – tester vybere ručně */ }

    /* --- tři kroky: co se stalo → popis → odeslání --- */
    var kroky = fh.querySelectorAll('.krok');
    var ukazatel = document.getElementById('ukazatel-text');
    var body = document.querySelectorAll('.ukazatel .bod');
    var tady = 1;
    function ukazKrok(n) {
      tady = n;
      Array.prototype.forEach.call(kroky, function (k) { k.hidden = Number(k.dataset.krok) !== n; });
      Array.prototype.forEach.call(body, function (b, i) { b.className = 'bod' + (i === n - 1 ? ' tady' : ''); });
      if (ukazatel) ukazatel.textContent = T.hlaseni.krok + ' ' + n + ' ' + T.hlaseni.krokZ + ' ' + kroky.length
        + ' – ' + T.hlaseni.krokNazvy[n - 1];
      var nadpis = kroky[n - 1].querySelector('h2');
      if (nadpis) { nadpis.setAttribute('tabindex', '-1'); nadpis.focus(); }
      window.scrollTo(0, 0);
    }
    // Údaje o zařízení – pevný seznam. Nic dalšího se neposílá: žádná poloha, žádná adresa.
    function zarizeni() {
      var n = T.hlaseni.neznamo;
      var sirka = window.screen ? window.screen.width : 0, vyska = window.screen ? window.screen.height : 0;
      var pamet = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : n;
      var pripojeni = (navigator.connection && navigator.connection.effectiveType) || n;
      return {
        system: navigator.platform || n,
        prohlizec: navigator.userAgent || n,
        obrazovka: sirka && vyska ? sirka + ' × ' + vyska + ' (' + (window.devicePixelRatio || 1) + '×)' : n,
        orientace: sirka >= vyska ? T.hlaseni.orientaceNaSirku : T.hlaseni.orientaceNaVysku,
        jazyk: navigator.language || n,
        pamet: pamet,
        pripojeni: pripojeni,
      };
    }
    function radek(dl, popisek, hodnota) {
      var d = el('div');
      d.appendChild(el('dt', popisek));
      d.appendChild(el('dd', hodnota || '—'));
      dl.appendChild(d);
    }
    function souhrn() {
      var p = document.getElementById('prehled');
      p.textContent = '';
      [['kategorie', T.hlaseni.kategorie], ['zavaznost', T.hlaseni.zavaznost], ['kroky', T.hlaseni.kroky],
        ['ocekavane', T.hlaseni.ocekavane], ['skutecne', T.hlaseni.skutecne], ['verze', T.hlaseni.verze],
        ['uroven', T.hlaseni.uroven], ['system', T.hlaseni.system], ['profil', T.hlaseni.profil]].forEach(function (pole) {
        var vybrany = fh.querySelector('input[name="' + pole[0] + '"]:checked');
        // u přepínače ukaž text, který člověk zaškrtl, ne hodnotu pro rozhraní
        if (vybrany) { radek(p, pole[1], (vybrany.parentElement.textContent || '').trim()); return; }
        var prvek = fh.elements[pole[0]];
        radek(p, pole[1], prvek && prvek.value);
      });
      radek(p, T.hlaseni.profilCas, profilCas ? profilCas + T.hlaseni.profilCasJednotka : T.hlaseni.profilCasNeprepnulo);
      var z = document.getElementById('zarizeni-prehled');
      z.textContent = '';
      var d = zarizeni();
      for (var k in T.hlaseni.zarizeniPolozky) radek(z, T.hlaseni.zarizeniPolozky[k], d[k]);
    }
    Array.prototype.forEach.call(fh.querySelectorAll('.dalsi'), function (b) {
      b.addEventListener('click', function () {
        if (!overPovinna(kroky[tady - 1])) { hlaska(hh, T.hlaseni.chybaPovinne); return; }
        hlaska(hh, '');
        if (tady + 1 === kroky.length) souhrn();
        ukazKrok(tady + 1);
      });
    });
    Array.prototype.forEach.call(fh.querySelectorAll('.zpet'), function (b) {
      b.addEventListener('click', function () { hlaska(hh, ''); ukazKrok(Math.max(1, tady - 1)); });
    });

    fh.addEventListener('submit', function (e) {
      e.preventDefault();
      // Kdyby chyběl údaj z dřívějšího kroku, vrať se na něj – jinak by chyba byla neviditelná.
      for (var i = 0; i < kroky.length; i++) {
        if (!overPovinna(kroky[i])) { hlaska(hh, T.hlaseni.chybaPovinne); ukazKrok(i + 1); return; }
      }
      var btn = fh.querySelector('button[type="submit"]');
      var data = { zarizeni: zarizeni() };
      if (profilCas) data.profilCas = profilCas;
      Array.prototype.forEach.call(fh.elements, function (p) {
        if (!p.name) return;
        if (p.type === 'radio') { if (p.checked) data[p.name] = p.value; return; }
        data[p.name] = p.value;
      });
      hlaska(hh, '');
      beziciTlacitko(btn, true, T.hlaseni.odesilam);
      api('/hlaseni', data)
        .then(function (r) {
          fh.hidden = true;
          hlaska(hh, T.hlaseni.uspech + (r.cislo || ''), 'ok');
          var znovu = document.getElementById('znovu');
          if (znovu) { znovu.hidden = false; znovu.focus(); }
        })
        .catch(function (err) {
          beziciTlacitko(btn, false);
          hlaska(hh, err && err.neprihlasen ? T.obecne.chybaPrihlaseni
            : (err && err.data && err.data.zprava) || T.hlaseni.chybaOdeslani);
        });
    });
    var znovuBtn = document.getElementById('znovu');
    if (znovuBtn) znovuBtn.addEventListener('click', function () {
      fh.reset();
      fh.hidden = false;
      znovuBtn.hidden = true;
      hlaska(hh, '');
      if (sys) sys.value = navigator.userAgent || '';
      ukazKrok(1);
    });
  }

  /* ---------- admin konzole ---------- */
  if (stranka === 'admin') {
    var ha = document.getElementById('hlaska');
    var tSl = T.admin.testeriSloupce, hSl = T.admin.hlaseniSloupce;

    var fpz = document.getElementById('form-pozvanka');
    fpz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!overPovinna(fpz)) return;
      var btn = fpz.querySelector('button[type="submit"]');
      beziciTlacitko(btn, true, T.admin.pozvankaOdesilam);
      api('/admin/pozvanka', {
        email: fpz.email.value.trim(), jmeno: fpz.jmeno.value.trim(),
        poznamka: fpz.poznamka.value.trim(), jazyk: fpz.jazyk.value, role: fpz.role.value
      }).then(function () {
        beziciTlacitko(btn, false);
        hlaska(ha, T.admin.pozvankaUspech + fpz.email.value.trim(), 'ok');
        fpz.reset();
        nactiTestery();
      }).catch(function (err) {
        beziciTlacitko(btn, false);
        hlaska(ha, err && err.neprihlasen ? T.obecne.chybaPrihlaseni : T.admin.pozvankaChyba);
      });
    });

    function nactiTestery() {
      var telo = document.getElementById('testeri-telo');
      api('/admin/testeri').then(function (r) {
        var t = (r && r.testeri) || [];
        telo.textContent = '';
        document.getElementById('testeri-prazdne').hidden = t.length > 0;
        t.forEach(function (x) {
          var tr = el('tr');
          [[tSl.email, x.email], [tSl.jmeno, x.jmeno], [tSl.stav, x.stav],
           [tSl.pozvan, x.pozvan], [tSl.posledni, x.posledni], [tSl.hlaseni, x.pocetHlaseni]].forEach(function (p) {
            tr.appendChild(el('td', p[1] == null || p[1] === '' ? '–' : String(p[1]), { 'data-popis': p[0] }));
          });
          var td = el('td', null, { 'data-popis': tSl.akce });
          var zrusen = x.aktivni === false;
          var b = el('button', zrusen ? T.admin.testerObnovit : T.admin.testerZrusit,
            { type: 'button', class: 'vedlejsi mala' });
          b.addEventListener('click', function () {
            if (!zrusen && !confirm(T.admin.testerPotvrdit + x.email)) return;
            api('/admin/tester-stav', { email: x.email, aktivni: zrusen })
              .then(nactiTestery)
              .catch(function (err) { hlaska(ha, textChyby(err)); });
          });
          td.appendChild(b);
          tr.appendChild(td);
          telo.appendChild(tr);
        });
      }).catch(function (err) { hlaska(ha, textChyby(err)); });
    }

    function nactiHlaseni() {
      var telo = document.getElementById('hlaseni-telo');
      var filtr = document.getElementById('filtr').value;
      api('/admin/hlaseni' + (filtr ? '?stav=' + encodeURIComponent(filtr) : '')).then(function (r) {
        var h = (r && r.hlaseni) || [];
        telo.textContent = '';
        document.getElementById('hlaseni-prazdne').hidden = h.length > 0;
        h.forEach(function (x) {
          var tr = el('tr');
          [[hSl.cislo, x.cislo], [hSl.datum, x.datum], [hSl.kategorie, x.kategorie],
           [hSl.zavaznost, x.zavaznost], [hSl.verze, x.verze], [hSl.tester, x.tester]].forEach(function (p) {
            tr.appendChild(el('td', p[1] == null || p[1] === '' ? '–' : String(p[1]), { 'data-popis': p[0] }));
          });
          var tdStav = el('td', null, { 'data-popis': hSl.stav });
          var sel = el('select', null, { 'aria-label': hSl.stav + ' ' + (x.cislo || '') });
          T.admin.hlaseniStavy.forEach(function (s) {
            var o = el('option', s, { value: s });
            if (s === x.stav) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener('change', function () {
            api('/admin/hlaseni-stav', { cislo: x.cislo, stav: sel.value })
              .then(function () { hlaska(ha, T.admin.stavUlozen, 'ok'); })
              .catch(function (err) { hlaska(ha, err && err.neprihlasen ? T.obecne.chybaPrihlaseni : T.admin.stavChyba); });
          });
          tdStav.appendChild(sel);
          tr.appendChild(tdStav);

          var tdDetail = el('td', null, { 'data-popis': hSl.detail });
          var det = el('details');
          det.appendChild(el('summary', T.admin.detailOtevrit));
          [['kroky', x.kroky], ['ocekavane', x.ocekavane], ['skutecne', x.skutecne],
           ['system', x.system], ['uroven', x.uroven], ['email', x.email]].forEach(function (p) {
            if (!p[1]) return;
            var dt = el('p');
            dt.appendChild(el('strong', (T.hlaseni[p[0]] || p[0]) + ': '));
            dt.appendChild(document.createTextNode(String(p[1])));
            det.appendChild(dt);
          });
          tdDetail.appendChild(det);
          tr.appendChild(tdDetail);
          telo.appendChild(tr);
        });
      }).catch(function (err) { hlaska(ha, textChyby(err)); });
    }

    document.getElementById('filtr').addEventListener('change', nactiHlaseni);
    nactiTestery();
    nactiHlaseni();
  }
})();
