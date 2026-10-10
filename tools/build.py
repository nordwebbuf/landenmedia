"""Builds every page of the site, in Swedish and English.

    python tools/build.py

Page content lives in src/sv/<page>.html (Swedish). The English version is made
by translating it with the table in tools/i18n.py, unless src/en/<page>.html
exists, in which case that file is used as is. Header, footer and <head> are
shared and defined here. The script lists any Swedish text left untranslated.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n import T as T1, ALLOWED, SITE  # noqa: E402
from i18n_pages import T2  # noqa: E402
from i18n_v3 import T3  # noqa: E402
from i18n_v4 import T4  # noqa: E402
from i18n_v5 import T5  # noqa: E402

T = T5 + T4 + T1 + T3 + T2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# key: (sv file, en file, sv title, en title, sv description, en description)
PAGES = {
    "index": ("index.html", "index.html",
              "NordenMedia UF | Webbyrå och livesändning",
              "NordenMedia UF | Web agency and live streaming",
              "NordenMedia UF är en webbyrå och livesändningsbyrå. Vi bygger och sköter hemsidor, domän, mejl, SEO och drift, och livesänder event och sammanträden. Ni driver verksamheten, vi sköter tekniken.",
              "NordenMedia UF is a web agency and live streaming agency. We build and manage websites, domains, email, SEO and hosting, and stream events and meetings live. You run your business, we handle the tech."),
    "webbtjanster": ("webbtjanster.html", "web-services.html",
                     "Webbtjänster | NordenMedia UF",
                     "Web services | NordenMedia UF",
                     "Hemsidor, domän, företagsmejl, SEO, AI-svar, Google-företagsprofil, automatisering och drift. Vi sköter allt, ni slipper tekniken.",
                     "Websites, domains, business email, SEO, AI answers, Google Business Profile, automation and hosting. We handle it all, you skip the tech."),
    "livesandning": ("livesandning.html", "live-streaming.html",
                     "Livesändning | NordenMedia UF",
                     "Live streaming | NordenMedia UF",
                     "Livesändning av event och sammanträden, från teknik på plats till färdig sändning. Flera kameror, grafik, sändning och inspelning.",
                     "Live streaming of events and meetings, from on-site equipment to finished broadcast. Multiple cameras, graphics, streaming and recording."),
    "priser": ("priser.html", "pricing.html",
               "Priser | NordenMedia UF",
               "Pricing | NordenMedia UF",
               "Tre paket med fast månadspris för hemsida, domän, mejl, synlighet och drift.",
               "Three packages with a fixed monthly price for website, domain, email, visibility and hosting."),
    "om-oss": ("om-oss.html", "about.html",
               "Om oss | NordenMedia UF",
               "About us | NordenMedia UF",
               "Människorna bakom NordenMedia, våra samarbetspartners och kunder.",
               "The people behind NordenMedia, our partners and clients."),
    "kontakt": ("kontakt.html", "contact.html",
                "Kontakt | NordenMedia UF",
                "Contact | NordenMedia UF",
                "Boka ett samtal med NordenMedia. Berätta om ert företag så hör vi av oss.",
                "Book a call with NordenMedia. Tell us about your business and we will be in touch."),
    "integritetspolicy": ("integritetspolicy.html", "privacy.html",
                          "Integritetspolicy | NordenMedia UF",
                          "Privacy policy | NordenMedia UF",
                          "Så hanterar NordenMedia dina personuppgifter.",
                          "How NordenMedia handles your personal data."),
    "404": ("404.html", None, "Sidan hittades inte | NordenMedia UF", None, "Sidan finns inte.", None),
}

NAV = ["webbtjanster", "livesandning", "priser", "om-oss"]
NAV_LABEL = {"webbtjanster": "Webbtjänster", "livesandning": "Livesändning", "priser": "Priser", "om-oss": "Om oss"}


def cta(title, text, primary, secondary_href, secondary_label):
    return f'''    <!-- CTA -->
    <section class="cta-band-wrap" aria-label="Kontakta oss">
      <div class="container">
        <div class="cta-band reveal">
          <div>
            <h2 class="cta-title">{title}</h2>
            <p>{text}</p>
          </div>
          <div class="cta-actions">
            <a href="{{{{p}}}}kontakt.html" class="btn btn-light">{primary} <i class="ph-light ph-arrow-right" aria-hidden="true"></i></a>
            <a href="{{{{p}}}}{secondary_href}" class="btn btn-ghost-light">{secondary_label}</a>
          </div>
        </div>
      </div>
    </section>'''


CTAS = {
    "{{CTA}}": cta("Lägg tiden på verksamheten. Vi tar hand om resten.", "Boka ett kort samtal så tar vi det därifrån. Det kostar ingenting att fråga.", "Boka ett samtal", "priser.html", "Se priser"),
    "{{CTA_ALT}}": cta("Osäkra på vilket paket som passar?", "Berätta om ert företag så hjälper vi er att välja. Det kostar ingenting att fråga.", "Boka ett samtal", "webbtjanster.html", "Se webbtjänster"),
    "{{CTA_LIVE}}": cta("Har ni ett evenemang på gång?", "Berätta om det så återkommer vi med ett förslag och ett fast pris.", "Boka ett samtal", "webbtjanster.html", "Se webbtjänster"),
}


def head(key, lang, p):
    sv_file, en_file, sv_title, en_title, sv_desc, en_desc = PAGES[key]
    title, desc = (sv_title, sv_desc) if lang == "sv" else (en_title, en_desc)
    def url(l):
        f = sv_file if l == "sv" else en_file
        f = "" if f == "index.html" else f
        return f"{SITE}/{f}" if l == "sv" else f"{SITE}/en/{f}"
    alt = "" if not en_file else f'''
  <link rel="alternate" hreflang="sv" href="{url("sv")}">
  <link rel="alternate" hreflang="en" href="{url("en")}">
  <link rel="alternate" hreflang="x-default" href="{url("sv")}">'''
    robots = '\n  <meta name="robots" content="noindex">' if key == "404" else ""
    return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">{robots}
  <meta name="theme-color" content="#F5F6F9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#070B16" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="{"sv_SE" if lang == "sv" else "en_GB"}">
  <meta property="og:site_name" content="NordenMedia UF">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}/assets/og-image.jpg">
  <meta property="og:url" content="{url(lang)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="{url(lang)}">{alt}
  <link rel="icon" type="image/png" href="{p}assets/favicon.png">
  <link rel="apple-touch-icon" href="{p}assets/apple-touch-icon.png">
  <link rel="manifest" href="{p}site.webmanifest">
  <link rel="preload" href="{p}assets/fonts/outfit-latin-3.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{p}assets/fonts/geist-latin-1.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{p}css/fonts.css">
  <link rel="stylesheet" href="{p}assets/icons/phosphor-light.css">
  <link rel="stylesheet" href="{p}css/styles.css">
  <link rel="stylesheet" href="{p}css/v3.css">
  <script>
    (function () {{
      var d = document.documentElement; d.classList.add('js');
      try {{ var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t); }} catch (e) {{}}
    }})();
  </script>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "NordenMedia UF",
    "url": "{SITE}/",
    "logo": "{SITE}/assets/nordenmedia.svg",
    "image": "{SITE}/assets/og-image.jpg",
    "email": "hej@nordenmedia.se",
    "description": "Hemsidor, webbsystem, domän, DNS, företagsmejl, SEO, optimering för AI-svar, Google-företagsprofiler, automatisering, hosting, drift och livesändningar för små och medelstora företag.",
    "areaServed": "SE",
    "knowsLanguage": ["sv", "en"]
  }}
  </script>
{{{{HEAD_EXTRA}}}}</head>'''


def chrome(key, lang, p, body):
    sv_file, en_file = PAGES[key][0], PAGES[key][1]
    home = "./"
    if lang == "sv":
        switch_href = f"en/{en_file if en_file != 'index.html' else ''}" if en_file else "en/"
        switch = f'<a class="tool-btn lang-switch" href="{switch_href}" hreflang="en" lang="en" aria-label="Switch to English">EN</a>'
        foot_lang = f'<li><a href="{switch_href}" hreflang="en" lang="en">English</a></li>'
    else:
        back = "../" + (sv_file if sv_file != "index.html" else "")
        switch = f'<a class="tool-btn lang-switch" href="{back}" hreflang="sv" lang="sv" aria-label="Byt till svenska">SV</a>'
        foot_lang = f'<li><a href="{back}" hreflang="sv" lang="sv">Svenska</a></li>'

    def nav_items(cls):
        out = []
        for k in NAV:
            cur = ' aria-current="page"' if k == key else ""
            out.append(f'<li><a href="{p}{PAGES[k][0]}"{cur}>{NAV_LABEL[k]}</a></li>')
        return "\n          ".join(out)

    contact_cur = ' aria-current="page"' if key == "kontakt" else ""
    mobile_cta = "" if key in ("kontakt", "404", "integritetspolicy") else f'''
  <div class="mobile-cta" data-mobile-cta aria-hidden="true">
    <a href="{p}kontakt.html" class="btn btn-primary btn-block" tabindex="-1">Boka ett samtal <i class="ph-light ph-arrow-right" aria-hidden="true"></i></a>
  </div>
'''
    return f'''
<body>
  <a class="skip-link" href="#main">Hoppa till innehållet</a>
  <div class="top-sentinel" aria-hidden="true"></div>

  <header class="site-header" data-header>
    <div class="progress" aria-hidden="true"></div>
    <div class="container header-inner">
      <a href="{home}" class="brand" aria-label="NordenMedia, till startsidan">
        <span class="logo" aria-hidden="true"></span>
      </a>

      <nav class="nav" aria-label="Huvudmeny">
        <ul class="nav-list">
          {nav_items("nav")}
        </ul>
      </nav>

      <div class="header-tools">
        {switch}
        <button class="tool-btn" type="button" data-theme-toggle aria-label="Byt till mörkt läge">
          <i class="ph-light ph-moon" data-theme-icon aria-hidden="true"></i>
        </button>
      </div>

      <a href="{p}kontakt.html" class="btn btn-primary btn-sm header-cta"{contact_cur}>Kontakt</a>

      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>
        <span class="sr-only">Öppna menyn</span>
        <span class="menu-icon" aria-hidden="true"><span></span><span></span></span>
      </button>
    </div>
  </header>

  <div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden>
    <nav class="container" aria-label="Mobilmeny">
      <ul class="mobile-list">
          {nav_items("mobile")}
      </ul>
      <a href="{p}kontakt.html" class="btn btn-primary btn-block"{contact_cur}>Kontakt <i class="ph-light ph-arrow-right" aria-hidden="true"></i></a>
    </nav>
  </div>

  <main id="main">
{body}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <p class="footer-tag">Webbyrå och livesändning. Ni driver verksamheten, vi sköter tekniken.</p>
        <nav class="footer-cols" aria-label="Sidfot">
          <div>
            <p class="footer-head">Tjänster</p>
            <ul>
              <li><a href="{p}webbtjanster.html">Webbtjänster</a></li>
              <li><a href="{p}livesandning.html">Livesändning</a></li>
              <li><a href="{p}priser.html">Priser</a></li>
            </ul>
          </div>
          <div>
            <p class="footer-head">NordenMedia</p>
            <ul>
              <li><a href="{p}om-oss.html">Om oss</a></li>
              <li><a href="{p}kontakt.html">Kontakt</a></li>
              <li><a href="{p}integritetspolicy.html">Integritetspolicy</a></li>
            </ul>
          </div>
          <div>
            <p class="footer-head">Kontakt</p>
            <ul>
              <li><a href="mailto:hej@nordenmedia.se">hej@nordenmedia.se</a></li>
              <li><a href="{p}kontakt.html">Boka ett samtal</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <span class="logo logo-xl" role="img" aria-label="NordenMedia"></span>
      <div class="footer-bottom">
        <p>© <span data-year>2026</span> NordenMedia UF</p>
        <ul class="footer-legal">
          {foot_lang}
          <li><a href="#top" class="to-top">Till toppen <i class="ph-light ph-arrow-up" aria-hidden="true"></i></a></li>
        </ul>
      </div>
    </div>
  </footer>
{mobile_cta}
  <script src="{p}js/main.js" defer></script>
  <script src="{p}js/v3.js" defer></script>
</body>
</html>
'''


def render(key, lang):
    p = "" if lang == "sv" else "../"
    src = os.path.join(ROOT, "src", "sv", f"{key}.html")
    body = open(src, encoding="utf-8").read()
    extra = ""
    m = re.search(r"<!--HEAD-->(.*?)<!--/HEAD-->", body, re.S)
    if m:
        extra, body = m.group(1).strip("\n") + "\n", body.replace(m.group(0), "")
    for k, v in CTAS.items():
        body = body.replace(k, v)
    html = head(key, lang, p).replace("{{HEAD_EXTRA}}", extra) + chrome(key, lang, p, body.rstrip())
    if key == "404":
        p = "/"  # served from any URL depth
        html = html.replace('href="./"', 'href="/"')
    html = html.replace("{{p}}", p)
    if key == "404":
        html = re.sub(r'(href|src)="(?!/|https?:|#|mailto:)', r'\1="/', html)
    return bust_cache(add_logo(html))


LOGO = json.load(open(os.path.join(ROOT, "tools", "logo_paths.json"), encoding="utf-8"))


def bust_cache(html):
    """Add a content hash to local CSS/JS links so browsers always load the latest version."""
    import hashlib

    def ver(m):
        attr, prefix, path = m.group(1), m.group(2), m.group(3)
        full = os.path.join(ROOT, path)
        if not os.path.exists(full):
            return m.group(0)
        h = hashlib.md5(open(full, "rb").read()).hexdigest()[:8]
        return f'{attr}="{prefix}{path}?v={h}"'
    return re.sub(r'(href|src)="((?:\.\./|/)?)((?:css|js|assets/icons)/[\w./-]+\.(?:css|js))"', ver, html)


def add_logo(html):
    """Embed the NordenMedia logo once per page and reference it wherever <span class="logo..."> is used."""
    vb = f'0 0 {LOGO["w"]} {LOGO["h"]}'
    html = re.sub(r'<span class="(logo[^"]*)"([^>]*)></span>',
                  rf'<svg class="\1" viewBox="{vb}"\2 focusable="false"><use href="#nm-logo"/></svg>', html)
    sprite = (
        '<svg class="nm-sprite" aria-hidden="true" focusable="false"><defs>'
        '<linearGradient id="nm-g" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" style="stop-color:var(--nm-1)"/><stop offset="1" style="stop-color:var(--nm-2)"/></linearGradient>'
        '<linearGradient id="nm-g-light" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>'
        f'<symbol id="nm-logo" viewBox="{vb}"><path style="fill:var(--nm-icon-fill, url(#nm-g))" d="{LOGO["icon"]}"/>'
        f'<path fill="currentColor" d="{LOGO["word"]}"/></symbol></defs></svg>'
    )
    return re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + "\n  " + sprite, html, count=1)


def translate(key, html):
    en_override = os.path.join(ROOT, "src", "en", f"{key}.html")
    for sv, en in T:
        html = html.replace(sv, en)
    if os.path.exists(en_override):
        # Use the hand-written English body instead of the translated one
        body = open(en_override, encoding="utf-8").read().replace("{{p}}", "../")
        html = re.sub(r"<main id=\"main\">.*?</main>", lambda _: f'<main id="main">\n{body.rstrip()}\n  </main>', html, flags=re.S)
    # Pages in /en/ are siblings: ../kontakt.html -> contact.html
    for k, (sv_file, en_file, *_rest) in PAGES.items():
        if en_file:
            html = html.replace(f'href="../{sv_file}', f'href="{en_file}')
    return html


def leftovers(html):
    text = re.sub(r"<script.*?</script>", "", html, flags=re.S)
    text = re.sub(r"<[^>]+>", "\n", text)
    for a in ALLOWED:
        text = text.replace(a, "")
    return [ln.strip() for ln in text.splitlines() if re.search(r"[åäöÅÄÖ]", ln)]


def sitemap():
    rows = []
    for key, (sv_file, en_file, *_rest) in PAGES.items():
        if not en_file:
            continue
        sv = f"{SITE}/" + ("" if sv_file == "index.html" else sv_file)
        en = f"{SITE}/en/" + ("" if en_file == "index.html" else en_file)
        for loc in (sv, en):
            rows.append(f"""  <url>
    <loc>{loc}</loc>
    <xhtml:link rel="alternate" hreflang="sv" href="{sv}"/>
    <xhtml:link rel="alternate" hreflang="en" href="{en}"/>
  </url>""")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)


def main():
    problems = 0
    os.makedirs(os.path.join(ROOT, "en"), exist_ok=True)
    for key, (sv_file, en_file, *_rest) in PAGES.items():
        sv_html = render(key, "sv")
        open(os.path.join(ROOT, sv_file), "w", encoding="utf-8").write(sv_html)
        if not en_file:
            continue
        en_html = translate(key, render(key, "en"))
        # language switch back to Swedish must keep ../
        sv_target = "../" + (sv_file if sv_file != "index.html" else "")
        en_html = re.sub(r'(<a class="tool-btn lang-switch" href=")[^"]*(" hreflang="sv")', rf"\g<1>{sv_target}\2", en_html)
        en_html = re.sub(r'(<li><a href=")[^"]*(" hreflang="sv" lang="sv">Svenska)', rf"\g<1>{sv_target}\2", en_html)
        open(os.path.join(ROOT, "en", en_file), "w", encoding="utf-8").write(en_html)
        left = leftovers(en_html)
        if left:
            problems += 1
            print(f"en/{en_file}: untranslated text")
            for ln in left:
                print("   ", ln)
    sitemap()
    print("Built", len(PAGES), "Swedish and", sum(1 for v in PAGES.values() if v[1]), "English pages")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
