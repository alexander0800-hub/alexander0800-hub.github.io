# Cloud report – web audit 2 (1. 10. 2026)

Větev `cloud/web-audit-2`, založená znovu z `main` (`f462479`, po sloučení #3 a #4). PR je draft, nic se nenasazuje.

> ⚠️ **Před sloučením tento soubor smažte nebo přesuňte.** Repo má `.nojekyll` a GitHub Pages publikuje celý `main`, takže po sloučení bude report veřejně na `https://www.alexandersoft.net/docs/CLOUD_REPORT_web_audit_2.md`.

## Výsledek kontrol (84 HTML stránek, 9 jazyků)

| # | Kontrola | Výsledek | Akce |
|---|---|---|---|
| 1 | Ceník ČHD: Home 249 Kč / 9,99 €, Commercial 999 Kč / 39,99 €, 1 zařízení, trvalé | ✅ ve všech 9 jazycích (karty, FAQ, JSON-LD). „5 let“, demo po vypršení ani prodloužení za 50 % nikde nejsou (všechny nálezy „15 let“ se týkají věku). | – |
| 2 | Věta o datech u ČHD přesně „Hra neposílá ven žádná data.“ | ✅ úvodní stránky. ❌ `pravni.html` (sekce Děti) měla „Hra nesbírá osobní údaje hráčů a postup ukládá jen v zařízení.“ | **Opraveno** v 9 jazycích (znění z karty Pro rodiče) |
| 3 | Nefunkční odkazy a obrázky | ✅ 0 rozbitých interních odkazů, kotev a `srcset` (URL bez `.html` se řeší jako na GitHub Pages). ❌ `style.css` se znovu odkazoval na neexistující `/img/level_poust.webp` (mrtvé pravidlo `.hero-shot`, vrátilo se s #3/#4). | **Opraveno** (pravidlo smazáno) |
| 4 | Přístupnost: alt, nadpisy, kontrast | ✅ všechny `<img>` mají `alt`; každá stránka má jeden `h1` a žádný přeskok úrovně nadpisu. Nové barvy (`.news-strip`, `stranka.css`) splňují AA: `#8a4610` / `#f4ecdc` 6,0 : 1, `#7a3e0c` / `#f4ecdc` 7,1 : 1, `#e0d6c8` na tmavém ≥ 9 : 1. | – |
| 5 | Žádná zmínka o iOS / App Store | ✅ nikde (HTML, JS, sitemap) | – |
| 6 | Prodej přes itch.io, ne Lemon Squeezy | ✅ „Lemon“ se nikde nevyskytuje. Obchod (`/cs/obchod/`, `/en/shop/`) a novinky uvádějí itch.io. Konkrétní odkazy na itch.io zatím nejsou („Odkaz na itch.io doplníme“). | – |

## K rozhodnutí CEO (nejednoznačné, neměněno)

1. **`pravni.html` (9 jazyků), sekce „Platba v bitcoinech“ a „ID transakce (txid)“** v Ochraně osobních údajů popisují prodej ČHD za BTC. Pokud se ČHD bude prodávat přes itch.io, je potřeba sekci přepsat. Jde o právní text, proto jen návrh.
2. **`pravni.html` → Licenční model:** „Ceny oznámíme se zahájením prodeje.“ je v rozporu s ceníkem (plánovaně 249 / 999 Kč). Návrh: „Plánované ceny uvádíme v ceníku; závazné budou se zahájením prodeje.“
3. **`robots.txt`** už neobsahuje `Disallow: /beta/` (změna v `c03b295`, zjevně záměrná). `/beta/` má dál `noindex, nofollow`. Jen upozorňuji, protože původní pravidlo zadání ho vyžadovalo.
4. **Odkaz na ČOI** (`www.coi.cz`, 18×) přesměrovává na `coi.gov.cz` (zjištěno v #2), URL by šlo aktualizovat.
5. Popisy delší než 160 znaků: `en/news/shop/` (175), `de|es/ke-stazeni` (174/173, `noindex`). Title `en/pisma/` má 68 znaků.
6. Externí odkazy jsem znovu neověřoval (síť cloudu je blokuje; v #2 je ověřil CEO ručně).

## Commity
- `Právní informace (Děti): věta o datech …` – 9× `pravni.html`
- `style.css: znovu odstraněno mrtvé pravidlo .hero-shot …`
- tento report
