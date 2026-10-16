"""Write one plain HTML page per species in English and Mexican Spanish, plus an index for each,
robots.txt and llms.txt (sitemap.xml comes from build_sitemap.py).

The explorer draws everything on a canvas, so search engines and AI assistants can't read it.
These pages give every species a readable, linkable page with the same facts its card shows,
built only from the public data files the site already uses (no new facts are added here),
plus the genus notes Lia approved (app/traits.js, Spanish in app/i18n.js).

    English:  app/species/<english-name>/      Spanish:  app/es/especies/<spanish-name>/

Spanish terms (group names, Red List categories, habitats, countries…) are read from app/i18n.js,
so the pages and the explorer always use the same words. Needs Node.js to read that file.

Run from the website repo folder (needs Python 3.12+ and Node) after build_public_data.py:
    python3 scripts/build_species_pages.py            # everything
    python3 scripts/build_species_pages.py swbhum1    # just these species codes (for checking a design)
"""
import html, json, re, subprocess, sys, unicodedata
from urllib.parse import quote
from pathlib import Path

APP = Path(__file__).resolve().parent.parent  # the website repo (this folder's parent)
SITE = "https://hummingbirds.world"
CONTACT = "lia@hummingbirds.world"
VERSION = "2026-10-16a"   # bump when species.css changes, so browsers fetch the new file

STATUS_COLOR = {"LC": "#60c659", "NT": "#cce226", "VU": "#f9e814", "EN": "#fc7f3f", "CR": "#ff4a2e",
                "EX": "#8a93a8", "DD": "#c9cfdc", "NE": "#c9cfdc"}
FAINT = re.compile(r"Rare|Uncertain|extinct", re.I)
# Two places that would both read "Virgin Islands" (the explorer uses the same names, in app.js).
EN_PLACE = {"Virgin Islands (UK)": "British Virgin Islands", "Virgin Islands (US)": "US Virgin Islands"}
EN_THE = {"Bahamas", "Cayman Islands", "Dominican Republic", "Falkland Islands", "Turks and Caicos Islands", "United States",
          "British Virgin Islands", "US Virgin Islands", "South Georgia & the South Sandwich Islands"}
FEMININE = {"Coqueta", "Esmeralda", "Metalura", "Amazilia", "Ninfa"}   # as in app/i18n.js

# English wording, the same as the cards in app.js.
EN = {
    "clade": {"Florisuginae": "topazes", "Phaethornithinae": "hermits", "Polytminae": "mangoes",
              "Lesbiinae": "coquettes and brilliants", "Patagoninae": "Patagona",
              "Trochilinae": "mountain gems, bees and emeralds"},
    "tribe": {"Lesbiini": "coquettes", "Heliantheini": "brilliants", "Lampornithini": "mountain gems",
              "Mellisugini": "bees", "Trochilini": "emeralds"},
    "iucn": {"LC": "Least concern", "NT": "Near threatened", "VU": "Vulnerable", "EN": "Endangered",
             "CR": "Critically endangered", "EX": "Extinct", "DD": "Data deficient", "NE": "Not evaluated"},
    "moves": {"Sedentary": "Stays put all year", "Partial migrant": "Some populations migrate", "Migratory": "Migrates"},
}


def load_es():
    """The ES_DATA block of app/i18n.js, evaluated by Node so comments and JS syntax are fine."""
    js = ("const src=require('fs').readFileSync(process.argv[1],'utf8');"
          "const m=src.match(/\\/\\* ES_DATA_START \\*\\/([\\s\\S]*?)\\/\\* ES_DATA_END \\*\\//);"
          "eval(m[1].replace('const ES_DATA','globalThis.ES_DATA'));process.stdout.write(JSON.stringify(ES_DATA));")
    return json.loads(subprocess.run(["node", "-e", js, str(APP / "i18n.js")], capture_output=True, text=True, check=True).stdout)


ESD = load_es()


def load_notes():
    """The English group notes (NOTES in app/traits.js)."""
    js = ("const src=require('fs').readFileSync(process.argv[1],'utf8');"
          "eval(src.replace('const NOTES','globalThis.NOTES'));process.stdout.write(JSON.stringify(NOTES));")
    return json.loads(subprocess.run(["node", "-e", js, str(APP / "traits.js")], capture_output=True, text=True, check=True).stdout)


NOTES_EN = load_notes()
e = lambda t: html.escape(str(t or ""), quote=True)


def slug(name):
    t = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def thumb(src, w):
    """A Commons thumbnail at a standard width (same rule as app.js)."""
    if not src.startswith("http"):
        return src
    if re.search(r"/\d+px-[^/]+$", src):
        return re.sub(r"/\d+px-([^/]+)$", rf"/{w}px-\1", src)
    m = re.match(r"^(.*/commons/)(./../)([^/]+)$", src)
    return f"{m[1]}thumb/{m[2]}{m[3]}/{w}px-{m[3]}" if m else src


species = json.loads((APP / "species.json").read_text())
photos = json.loads((APP / "photos.json").read_text())
own = json.loads((APP / "own_photos.json").read_text())
ml = json.loads((APP / "ml_photos.json").read_text())
# Lia's own videos on YouTube, by species code: {"<code>": [{"youtube": id, "author", "place", "date", "date_es", "vertical"}]}.
videos = json.loads((APP / "videos.json").read_text())
by_genus = {}
iso_by_name = {}
for s in species:
    by_genus.setdefault(s["genus"], []).append(s)
    s["slug_en"], s["slug_es"] = slug(s["common"]), slug(s["es"])
    for d in s["dist"]:
        iso_by_name[d["c"]] = d["iso"]
# Countries with at least one species that lives there or visits regularly get their own page
# (build_country_pages.py); places with only rare strays are listed in the country index only.
paged = {d["c"] for s in species for d in s["dist"] if not FAINT.search(d["st"])}
for k in ("slug_en", "slug_es"):
    assert len({s[k] for s in species}) == len(species), f"two species share a page address ({k})"

index_html = (APP / "index.html").read_text()
FONTS = re.search(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]+>', index_html)[0]
ANALYTICS = """<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "f690c0c8331140bf9ef76125f66b0722"}'></script><!-- End Cloudflare Web Analytics -->"""


class Lang:
    """Everything that differs between the English and the Spanish pages."""

    def __init__(self, code):
        self.code, self.es = code, code == "es"
        self.dir = "es/especies" if self.es else "species"
        self.cdir = "es/paises" if self.es else "countries"
        self.clade = ESD["clade"] if self.es else EN["clade"]
        self.tribe = ESD["tribe"] if self.es else EN["tribe"]
        self.iucn = ESD["iucn"] if self.es else EN["iucn"]
        self.moves = ESD["moves"] if self.es else EN["moves"]

    def t(self, en, es):
        return es if self.es else en

    def name(self, s):
        return s["es"] if self.es else s["common"]

    def slug(self, s):
        return s["slug_es"] if self.es else s["slug_en"]

    def url(self, s):
        return f"{SITE}/{self.dir}/{self.slug(s)}/"

    def country(self, c):
        if self.es and ESD["country"].get(iso_by_name.get(c)):
            return ESD["country"][iso_by_name[c]]
        return EN_PLACE.get(c) or re.sub(r"\s*\((UK|US|France|Netherlands)\)", "", c)

    def place(self, c):
        """The country's name as it reads in a sentence: 'the Bahamas', 'las Islas Caimán'."""
        n = self.country(c)
        if self.es:
            return ("las " if n.startswith("Islas ") or n == "Bahamas" else "la " if n.startswith("República ") else "") + n
        return ("the " if n in EN_THE else "") + n

    def country_path(self, c):
        """The country page's path from the site root, or None for places with only rare strays."""
        return f"{self.cdir}/{slug(self.country(c))}/" if c in paged else None

    def habitat(self, h):
        return ESD["habitat"].get(h, h) if self.es else h

    def trend(self, tr):
        return ESD["trend"].get(tr, tr) if self.es else tr.lower()

    def presence(self, st):
        return ", ".join(ESD["presence"].get(p, p) for p in st.split(", ")) if self.es else st.lower()

    def and_list(self, items):
        items = list(items)
        return items[0] if len(items) == 1 else ", ".join(items[:-1]) + self.t(" and ", " y ") + items[-1]

    def the(self, s):
        """'the Sword-billed Hummingbird' / 'el Colibrí Picoespada', 'la Coqueta Adornada'."""
        if not self.es:
            return f"the {s['common']}"
        return f"{'la' if s['es'].split(' ')[0] in FEMININE else 'el'} {s['es']}"

    def called(self, group):
        """Plural group names a genus goes by, read from its species' names (as in app.js)."""
        out = []
        if self.es:
            for w in dict.fromkeys(s["es"].split(" ")[0] for s in group):
                if w == "Colibrí":
                    continue
                w = w.lower()
                out.append(w[:-1] + "ces" if w.endswith("z") else w + "s" if w[-1] in "aeiou" else w + "es")
            return out
        for w in dict.fromkeys(s["common"].split(" ")[-1] for s in group):
            if w == "Hummingbird":
                continue
            w = w.lower()
            if re.search(r"[^aeiou]y$", w): w = w[:-1] + "ies"
            elif re.search(r"(s|x|z|ch|sh)$", w): w += "es"
            else: w += "s"
            out.append(w)
        return out

    def group_name(self, s):
        if s["tribe"] != "—":
            return self.t(f"the tribe {s['tribe']} ({self.tribe[s['tribe']]})", f"la tribu {s['tribe']} ({self.tribe[s['tribe']]})")
        return self.t(f"the subfamily {s['subfamily']} ({self.clade[s['subfamily']]})", f"la subfamilia {s['subfamily']} ({self.clade[s['subfamily']]})")


L_EN, L_ES = Lang("en"), Lang("es")


def photo_list(s):
    commons = photos.get(s["code"]) or []
    commons = commons if isinstance(commons, list) else [commons]
    return list(own.get(s["code"], [])) + commons


def credit(ph, L):
    if L.es and ph.get("license") == "All rights reserved":
        lic = "Todos los derechos reservados"
    else:
        lic = f'<a href="{e(ph["licenseUrl"])}" rel="noopener">{e(ph["license"])}</a>' if ph.get("licenseUrl") else e(ph.get("license"))
    src = f' · <a href="{e(ph["page"])}" rel="noopener">{e(ph.get("site") or "Wikimedia Commons")}</a>' if ph.get("page") else ""
    return f"{L.t('Photo', 'Foto')}: {e(ph.get('artist'))} · {lic}{src}"


def image_object(ph, url):
    """schema.org ImageObject with the photographer and license, so search engines can show the credit."""
    obj = {"@type": "ImageObject", "contentUrl": url, "width": ph.get("w"), "height": ph.get("h"),
           "creditText": ph.get("artist"), "creator": {"@type": "Person", "name": ph.get("artist")}}
    if ph.get("licenseUrl"):
        obj["license"] = ph["licenseUrl"]
        obj["acquireLicensePage"] = ph.get("page") or ph["licenseUrl"]
    return {k: v for k, v in obj.items() if v}


def relatives(s):
    rel = [x for x in species if x is not s and x["genus"] == s["genus"]]
    if not rel:
        rel = [x for x in species if x is not s and (x["tribe"] == s["tribe"] if s["tribe"] != "—" else x["subfamily"] == s["subfamily"])]
    return sorted(rel, key=lambda x: abs(x["seq"] - s["seq"]))[:10]


def summary(s, L, plain=False):
    """A short factual paragraph, built only from the fields shown on the card."""
    i = (lambda t: t) if plain else (lambda t: f"<i>{e(t)}</i>")
    t = (lambda x: x) if plain else e
    tribe = (L.t(f", tribe {i(s['tribe'])} ({t(L.tribe[s['tribe']])})", f", tribu {i(s['tribe'])} ({t(L.tribe[s['tribe']])})")
             if s["tribe"] != "—" else "")
    sub = f"{i(s['subfamily'])} ({t(L.clade[s['subfamily']])})"
    who = t(L.the(s))
    parts = [L.t(f"{who[0].upper()}{who[1:]} ({i(s['sci'])}) is a hummingbird in the subfamily {sub}{tribe}.",
                 f"{who[0].upper()}{who[1:]} ({i(s['sci'])}) es un colibrí de la subfamilia {sub}{tribe}.")]
    if s["mass"]:
        parts.append(L.t(f"It weighs about {s['mass']} g" + (f" and its bill is {s['bill']} mm long." if s["bill"] else "."),
                         f"Pesa alrededor de {s['mass']} g" + (f" y su pico mide {s['bill']} mm." if s["bill"] else ".")))
    if s["endemic"]:
        parts.append(L.t(f"It is found only in {t(L.place(s['endemic']))}.", f"Solo vive en {t(L.place(s['endemic']))}."))
    else:
        lives = [L.place(d["c"]) for d in sorted(s["dist"], key=lambda d: -(d["n"] or 0)) if not FAINT.search(d["st"])]
        if len(lives) >= 9:
            parts.append(L.t(f"It lives in {len(lives)} countries, including {t(L.and_list(lives[:5]))}.",
                             f"Vive en {len(lives)} países, entre ellos {t(L.and_list(lives[:5]))}."))
        elif lives:
            parts.append(L.t(f"It lives in {t(L.and_list(lives))}.", f"Vive en {t(L.and_list(lives))}."))
    status = L.iucn.get(s["iucn"], s["iucn"])
    if s["iucn"] == "EX":
        parts.append(L.t("The IUCN Red List lists it as Extinct.", "La Lista Roja de la UICN lo clasifica como Extinto."))
    else:
        trend = L.trend(s["trend"]) if s["trend"] and s["trend"] != "Unknown" else ""
        parts.append(L.t(f"Its IUCN Red List status is {status}" + (f", with a {trend} population." if trend else "."),
                         f"Su estado en la Lista Roja de la UICN es {status}" + (f", con una población {trend}." if trend else ".")))
    return " ".join(parts)


def fit(*options, limit):
    """The first option that fits in `limit` characters (search engines cut longer titles and descriptions)."""
    return next((o for o in options if len(o) <= limit), options[-1])


def species_title(s, L):
    """Up to 60 characters: the name and scientific name, plus what the page offers when there is room."""
    nm = f"{L.name(s)} ({s['sci']})"
    return fit(nm + L.t(": size, range & photo", ": tamaño, área y foto"), nm, limit=60)


def species_description(s, L):
    """Up to 155 characters, built from the same fields as the page: size, countries, Red List status."""
    nm = f"{L.name(s)} ({s['sci']})"
    size = ""
    if s["mass"]:
        size = L.t(f": about {s['mass']} g", f": unos {s['mass']} g") + (L.t(f", bill {s['bill']} mm", f", pico de {s['bill']} mm") if s["bill"] else "")
    lives = [L.place(d["c"]) for d in sorted(s["dist"], key=lambda d: -(d["n"] or 0)) if not FAINT.search(d["st"])]
    if s["endemic"]:
        where = [L.t(f"Found only in {L.place(s['endemic'])}.", f"Solo vive en {L.place(s['endemic'])}.")]
    elif lives:
        where = [L.t(f"Lives in {L.and_list(lives)}.", f"Vive en {L.and_list(lives)}.")] if len(lives) <= 3 else []
        where += [L.t(f"Lives in {len(lives)} countries, including {L.and_list(lives[:2])}.", f"Vive en {len(lives)} países, entre ellos {L.and_list(lives[:2])}."),
                  L.t(f"Lives in {len(lives)} countries.", f"Vive en {len(lives)} países.")]
    else:
        where = [""]
    red = L.t(f"Red List: {L.iucn.get(s['iucn'], s['iucn'])}.", f"Lista Roja: {L.iucn.get(s['iucn'], s['iucn'])}.")
    options = [" ".join(f"{nm}{size}. {w} {red}{end}".split()) for w in where for end in (L.t(" Photo and facts.", " Foto y datos."), "")]
    return fit(*options, " ".join(f"{nm}{size}. {red}".split()), limit=155)


def head(L, title, desc, canonical, alternates, root, image=None, extra=""):
    img = image or f"{SITE}/og.jpg"
    alt = "".join(f'<link rel="alternate" hreflang="{h}" href="{u}">\n' for h, u in alternates)
    return f"""<!doctype html>
<html lang="{L.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canonical}">
{alt}<meta property="og:type" content="website">
<meta property="og:site_name" content="Hummingbirds World">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{e(img)}">{L.t("", chr(10) + '<meta property="og:locale" content="es_MX">')}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}favicon.ico" sizes="48x48">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="{root}icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{root}icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
{FONTS}
<link rel="stylesheet" href="{root}species.css?v={VERSION}">
{extra}</head>
<body>
"""


def header(L, root, other_href):
    home = root + L.t("", "es/")
    return f"""<header class="site"><a class="brand" href="{home}"><img class="logo" src="{root}logo-light.svg" alt=""><span>Hummingbirds World</span></a>
<nav class="tools"><a class="lang" href="{other_href}" onclick="try{{localStorage.setItem('hw-lang','{L.t('es', 'en')}')}}catch(e){{}}" hreflang="{L.t('es', 'en')}" lang="{L.t('es', 'en')}"><span class="wide">{L.t('Español', 'English')}</span><span class="narrow">{L.t('ES', 'EN')}</span></a>
<a class="explore" href="{home}"><span class="wide">{L.t('Open the explorer', 'Abrir el explorador')}</span><span class="narrow">{L.t('Explorer', 'Explorar')}</span></a></nav></header>
"""


def foot(L, root):
    return f"""<footer class="site">
<p><a href="{root}{L.t('', 'es/')}">Hummingbirds World</a> · <a href="{root}{L.dir}/">{L.t('All 363 species', 'Las 363 especies')}</a> · <a href="{root}{L.cdir}/">{L.t('By country', 'Por país')}</a></p>
<p>{L.t('A personal, non-commercial project by Lia Guttman. Full data sources and photo credits are listed under About &amp; credits in the explorer.',
        'Un proyecto personal y sin fines comerciales de Lia Guttman. Las fuentes de datos y los créditos de las fotos completos están en «Acerca del sitio», en el explorador.')}</p>
<p>{L.t('Contact', 'Contacto')}: <a href="mailto:{CONTACT}">{CONTACT}</a></p>
</footer>
{ANALYTICS}
</body>
</html>
"""


def species_page(s, L):
    depth = L.dir.count("/") + 2
    root = "../" * depth
    url = L.url(s)
    other = L_ES if not L.es else L_EN
    alternates = [("en", L_EN.url(s)), ("es", L_ES.url(s)), ("x-default", L_EN.url(s))]
    explorer = f"{root}{L.t('', 'es/')}?species={e(s['code'])}"
    name = L.name(s)
    plist = photo_list(s)
    first = plist[0] if plist else None
    img_abs = (thumb(first["src"], 960) if first["src"].startswith("http") else f"{SITE}/{first['src']}") if first else None

    if first:
        src = thumb(first["src"], 960) if first["src"].startswith("http") else root + first["src"]
        ratio = max(0.8, min(1.6, first["w"] / first["h"])) if first.get("w") and first.get("h") else 4 / 3
        more = len(plist) - 1
        photo = (f'<figure class="photo"><img src="{e(src)}" alt="{e(name)} ({e(s['sci'])})" width="{first.get("w", "")}" height="{first.get("h", "")}" '
                 f'style="aspect-ratio:{ratio:.3f}"><figcaption>{credit(first, L)}'
                 + (f' · <a href="{explorer}">{L.t(f"{more} more in the explorer", f"{more} más en el explorador")}</a>' if more else "")
                 + "</figcaption></figure>")
    elif ml.get(s["code"]):
        mid = str(ml[s["code"]][0])
        page = f"https://macaulaylibrary.org/asset/{mid}"
        photo = (f'<figure class="photo ml"><iframe src="{page}/embed" title="{e(name)}, {L.t("photo from the Macaulay Library", "foto de la Macaulay Library")}" loading="lazy" allowfullscreen></iframe>'
                 f'<figcaption>{L.t("Photo from the", "Foto de la")} <a href="{page}" rel="noopener">Macaulay Library (ML{e(mid)})</a>; '
                 f'{L.t("photographer credited in the photo", "el crédito del fotógrafo aparece en la foto")}</figcaption></figure>')
    else:
        photo = f'<p class="nophoto">{L.t("No free photo of this species yet.", "Todavía no hay una foto libre de esta especie.")}</p>'

    clips = max(1, round(s["mass"])) if s["mass"] else 0
    facts = []
    if s["mass"]:
        facts.append((L.t("Weight", "Peso"), L.t(f"{s['mass']} g, about {clips} paperclip{'s' if clips > 1 else ''}",
                                                f"{s['mass']} g, más o menos {clips} clip{'s' if clips > 1 else ''}")))
    if s["bill"]: facts.append((L.t("Bill", "Pico"), f"{s['bill']} mm"))
    if s["habitat"]: facts.append((L.t("Lives in", "Vive en"), e(L.habitat(s["habitat"]))))
    if s["migration"]: facts.append((L.t("Moves", "Movimientos"), e(L.moves.get(s["migration"], s["migration"]))))
    trend = f", {e(L.trend(s['trend']))}" if s["trend"] and s["trend"] != "Unknown" else ""
    note = (f'<small class="stnote">{e(L.t(s["status_note"], s["status_note_es"]))} <a href="{e(s["status_src"])}" target="_blank" rel="noopener">Birds of the World ↗</a></small>'
            if s.get("status_note") else "")
    facts.append((L.t("Red List status", "Lista Roja"), f'<span class="status" style="--st:{STATUS_COLOR.get(s["iucn"], "#c9cfdc")}">{e(L.iucn.get(s["iucn"], s["iucn"]))}</span>{trend}{note}'))
    if s["endemic"]:
        facts.append((L.t("Endemic", "Endémico"), L.t(f"Found only in {e(L.place(s['endemic']))}", f"Solo vive en {e(L.place(s['endemic']))}")))
    facts_html = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in facts)
    # Videos play from YouTube's privacy-enhanced domain, so no YouTube cookies are set until someone presses play.
    video_html = "".join(
        f'<figure class="video{" tall" if v.get("vertical") else ""}"><iframe src="https://www.youtube-nocookie.com/embed/{e(v["youtube"])}" '
        f'title="{e(name)}, {L.t("video by", "video de")} {e(v["author"])}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" '
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
        f'<figcaption>{e(v["author"])} · {e(v["place"])}, {e(L.t(v["date"], v.get("date_es", v["date"])))} · '
        f'<a href="https://www.youtube.com/watch?v={e(v["youtube"])}" target="_blank" rel="noopener">YouTube ↗</a></figcaption></figure>'
        for v in videos.get(s["code"], []))
    if video_html:
        video_html = f"\n<h2>{L.t('Video', 'Video')}</h2>\n{video_html}\n"

    tribe_row = (f'<li><span class="rank">{L.t("Tribe", "Tribu")}</span> <i>{e(s["tribe"])}</i> <em>{e(L.tribe[s["tribe"]])}</em></li>'
                 if s["tribe"] != "—" else "")
    called = ", ".join(L.called(by_genus[s["genus"]]))
    places = (f'<ol class="places"><li><span class="rank">{L.t("Family", "Familia")}</span> <i>Trochilidae</i> <em>{L.t("hummingbirds", "colibríes")}</em></li>'
              f'<li><span class="rank">{L.t("Subfamily", "Subfamilia")}</span> <i>{e(s["subfamily"])}</i> <em>{e(L.clade[s["subfamily"]])}</em></li>{tribe_row}'
              f'<li><span class="rank">{L.t("Genus", "Género")}</span> <i>{e(s["genus"])}</i>{f" <em>{e(called)}</em>" if called else ""}</li></ol>')

    gnote = (ESD["notes"] if L.es else NOTES_EN)["genus"].get(s["genus"])
    if gnote:
        g = e(s["genus"])
        label = L.t(f"What <i>{g}</i> share:", f"Lo que tienen en común los <i>{g}</i>:")
        places += f'\n<p class="note"><b>{label}</b> {e(gnote)}</p>'

    order = lambda d: (1 if FAINT.search(d["st"]) else 0, -(d["n"] or 0))
    cname = lambda c: f'<a href="{root}{L.country_path(c)}">{e(L.country(c))}</a>' if L.country_path(c) else e(L.country(c))
    countries = "".join(f'<li>{cname(d["c"])}{f" <small>{e(L.presence(d["st"]))}</small>" if FAINT.search(d["st"]) else ""}</li>'
                        for d in sorted(s["dist"], key=order))
    n_c = len(s["dist"])
    where = L.t(f"Where it lives · {n_c} {'country' if n_c == 1 else 'countries'}", f"Dónde vive · {n_c} {'país' if n_c == 1 else 'países'}")

    rel = relatives(s)
    rel_title = (L.t(f"Others in the genus <i>{e(s['genus'])}</i>", f"Otros del género <i>{e(s['genus'])}</i>") if rel and rel[0]["genus"] == s["genus"]
                 else L.t(f"Nearest relatives, in {e(L.group_name(s))}", f"Parientes más cercanos, en {e(L.group_name(s))}"))
    rel_html = "".join(f'<li><a href="../{L.slug(r)}/">{e(L.name(r))}</a> <i>{e(r["sci"])}</i></li>' for r in rel)

    alt_name = L.t(s["es"] and f'Spanish: {e(s["es"])}', f'Inglés: {e(s["common"])}')
    names = [alt_name, s["ioc_name"] and f'IOC: {e(s["ioc_name"])}']
    desc = species_description(s, L)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Taxon", "@id": url + "#taxon", "name": s["sci"], "taxonRank": "species", "url": url, "inLanguage": L.code,
         "alternateName": list(dict.fromkeys(n for n in [name, s["common"], s["es"], s["ioc_name"]] if n)),
         "parentTaxon": {"@type": "Taxon", "name": s["genus"], "taxonRank": "genus"},
         **({"image": image_object(first, img_abs)} if img_abs else {})},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Hummingbirds World", "item": SITE + L.t("/", "/es/")},
            {"@type": "ListItem", "position": 2, "name": L.t("All species", "Todas las especies"), "item": f"{SITE}/{L.dir}/"},
            {"@type": "ListItem", "position": 3, "name": name, "item": url}]}]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    ebird = f"https://ebird.org/species/{e(s['code'])}{L.t('', '?siteLanguage=es_MX')}"
    other_href = "../" * depth + f"{other.dir}/{other.slug(s)}/"

    return head(L, species_title(s, L), desc, url, alternates, root, img_abs, extra) + header(L, root, other_href) + f"""<main class="sp">
<nav class="crumbs" aria-label="{L.t('Breadcrumb', 'Ruta')}"><a href="../">{L.t('All species', 'Todas las especies')}</a> › <i>{e(s['subfamily'])}</i>{f" › <i>{e(s['tribe'])}</i>" if s['tribe'] != "—" else ""} › <i>{e(s['genus'])}</i></nav>
{photo}
<h1>{e(name)}</h1>
<p class="sci"><i>{e(s['sci'])}</i> <span>{e(s['authority'])}</span></p>
<p class="alt">{" · ".join(n for n in names if n)}</p>
<p class="lede">{summary(s, L)}</p>
<p class="actions"><a class="btn" href="{explorer}">{L.t('See it in the explorer', 'Verlo en el explorador')}</a> <a href="{ebird}" target="_blank" rel="noopener">{L.t('eBird page', 'Página en eBird')} ↗</a></p>

<h2>{L.t('At a glance', 'De un vistazo')}</h2>
<dl class="facts">{facts_html}</dl>
{video_html}
<h2>{L.t('Its place in the family', 'Su lugar en la familia')}</h2>
{places}

<h2>{where}</h2>
<ul class="chips">{countries}</ul>

<h2>{rel_title}</h2>
<ul class="rel">{rel_html}</ul>

<h2>{L.t('Sources', 'Fuentes')}</h2>
<p class="sources">{L.t(
    f'Names: eBird/Clements Checklist (Cornell Lab of Ornithology){", IOC World Bird List" if s["ioc_name"] else ""}. Groups: Dickinson &amp; Remsen (2013) and McGuire et al. (2014). '
    'Weight, bill, habitat and movement: AVONET (Tobias et al. 2022, CC BY 4.0). Countries: BirdLife International DataZone, checked against eBird records via GBIF. '
    'Red List status and trend: BirdLife International, the IUCN Red List authority for birds.',
    f'Nombres: eBird/Clements Checklist (Cornell Lab of Ornithology), con los nombres en español de eBird México{", e IOC World Bird List" if s["ioc_name"] else ""}. '
    'Grupos: Dickinson y Remsen (2013) y McGuire et al. (2014); los nombres de los grupos siguen los de eBird en español y la literatura en español sobre colibríes cuando existen y, si no, se dejan en inglés. '
    'Peso, pico, hábitat y movimientos: AVONET (Tobias et al. 2022, CC BY 4.0). Países: BirdLife International DataZone, comparado con registros de eBird a través de GBIF. '
    'Estado y tendencia en la Lista Roja: BirdLife International, la autoridad de la Lista Roja de la UICN para las aves.')}</p>
<p class="report">{L.t('Spotted a mistake, or have a photo of this species?', '¿Encontraste un error o tienes una foto de esta especie?')} <a href="mailto:{CONTACT}?subject={quote(f"{name} ({s['sci']})")}">{L.t('Write to Lia', 'Escríbele a Lia')}</a></p>
</main>
""" + foot(L, root)


def index_page(L):
    depth = L.dir.count("/") + 1
    root = "../" * depth
    other = L_ES if not L.es else L_EN
    alternates = [("en", f"{SITE}/species/"), ("es", f"{SITE}/es/especies/"), ("x-default", f"{SITE}/species/")]
    out = []
    for sub in dict.fromkeys(s["subfamily"] for s in sorted(species, key=lambda x: x["seq"])):
        members = [s for s in species if s["subfamily"] == sub]
        out.append(f'<section><h2><i>{e(sub)}</i> <em>{e(L.clade[sub])} · {len(members)} {L.t("species", "especies")}</em></h2>')
        for g in dict.fromkeys(s["genus"] for s in sorted(members, key=lambda x: x["seq"])):
            items = "".join(f'<li><a href="{L.slug(s)}/">{e(L.name(s))}</a></li>' for s in sorted(by_genus[g], key=lambda x: x["seq"]))
            out.append(f'<h3><i>{e(g)}</i></h3><ul class="list">{items}</ul>')
        out.append("</section>")
    title = L.t("Hummingbird species list: all 363, with photos", "Lista de especies de colibrí: las 363, con fotos")
    desc = L.t("The complete list of the world's 363 hummingbird species (family Trochilidae), by subfamily and genus, each with a photo, weight and Red List status.",
               "La lista completa de las 363 especies de colibrí del mundo, por subfamilia y género, cada una con foto, peso y estado en la Lista Roja.")
    lede = L.t(f'Every species in the hummingbird family, Trochilidae, as recognized in the eBird/Clements taxonomy. They are grouped by subfamily and genus, in taxonomic order. <a href="{root}">Explore them as a flock</a> by family tree, on the world map, by size and by conservation status.',
               f'Todas las especies de la familia de los colibríes, Trochilidae, según la taxonomía eBird/Clements, con sus nombres en español de eBird México. Están agrupadas por subfamilia y género, en orden taxonómico. <a href="{root}es/">Explóralas como una parvada</a>: por árbol familiar, en el mapa del mundo, por tamaño y por estado de conservación.')
    ordered = sorted(species, key=lambda x: x["seq"])
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": title, "url": f"{SITE}/{L.dir}/", "inLanguage": L.code,
          "numberOfItems": len(ordered), "itemListOrder": "https://schema.org/ItemListUnordered",
          "itemListElement": [{"@type": "ListItem", "position": i, "url": L.url(s), "name": L.name(s)} for i, s in enumerate(ordered, 1)]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    return (head(L, title, desc, f"{SITE}/{L.dir}/", alternates, root, None, extra) + header(L, root, root + other.dir + "/")
            + f"""<main class="sp idx">
<h1>{L.t('All 363 hummingbird species', 'Las 363 especies de colibrí')}</h1>
<p class="lede">{lede}</p>
{"".join(out)}
</main>
""" + foot(L, root))


def write(path, text):
    """Write only when the content changed, so Dropbox doesn't re-sync hundreds of identical files."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text() != text:
        path.write_text(text)
        return 1
    return 0


if __name__ == "__main__":
    only = set(sys.argv[1:])
    changed = 0
    for L in (L_EN, L_ES):
        for s in species:
            if only and s["code"] not in only:
                continue
            changed += write(APP / L.dir / L.slug(s) / "index.html", species_page(s, L))
        changed += write(APP / L.dir / "index.html", index_page(L))

    if not only:
        # sitemap.xml is written by build_sitemap.py, which build_country_pages.py runs last.
        changed += write(APP / "robots.txt", f"# Everyone is welcome, search engines and AI assistants alike.\nUser-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
        changed += write(APP / "llms.txt", f"""# Hummingbirds World

> An interactive explorer of all 363 hummingbird species (family Trochilidae), by Lia Guttman, a birder. Personal and non-commercial. In English and in Mexican Spanish.

Each country in the Americas with hummingbirds has its own page: how many species live there, how it ranks against other countries, its endemic species, their Red List status and their sizes.

Each species has its own page with its names (English, scientific, Spanish), its place in the family (subfamily, tribe, genus), weight, bill length, habitat, movement, the countries it lives in, its IUCN Red List status and trend, and a credited photo.

Sources: eBird/Clements Checklist (names and taxonomy; Spanish names from eBird Mexico), Dickinson & Remsen 2013 and McGuire et al. 2014 (subfamilies and tribes), AVONET (Tobias et al. 2022; weight, bill, habitat, movement), BirdLife International DataZone and eBird records via GBIF (countries), BirdLife International / IUCN Red List (status and trend).

## Pages

- [All 363 species]({SITE}/species/): every species, grouped by subfamily and genus, linking to its page
- [Las 363 especies]({SITE}/es/especies/): the same in Mexican Spanish
- [Hummingbirds by country]({SITE}/countries/): every country ranked by number of species and endemics, linking to its page ([en español]({SITE}/es/paises/))
- [The explorer]({SITE}/): the interactive site, with family tree, world map, size and status views and a 3D anatomy page ([en español]({SITE}/es/))
""")
    n = len(only) if only else len(species)
    print(f"{n} species × 2 languages, indexes" + ("" if only else ", robots.txt, llms.txt") + f"; {changed} files changed")
