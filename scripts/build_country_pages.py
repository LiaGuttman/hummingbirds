"""Write one page per country in English and Mexican Spanish: which hummingbirds live there, how the
country compares with the rest of the Americas, its endemics, their Red List status and sizes.

Like the species pages, everything is calculated from the public data files the site already uses
(app/species.json and the photo lists); nothing new is added here. Words shared with the explorer
(group names, Red List categories, countries) come from app/i18n.js through build_species_pages.py.

    English:  app/countries/<english-name>/      Spanish:  app/es/paises/<spanish-name>/

Run from the website repo folder (needs Python 3.12+ and Node) after build_species_pages.py:
    python3 scripts/build_country_pages.py        # every country with a regular species, plus the index
    python3 scripts/build_country_pages.py MX     # just these ISO codes (for checking a design)
"""
import json, math, sys
from collections import Counter

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from build_species_pages import (APP, SITE, STATUS_COLOR, FAINT, L_EN, L_ES, e, slug, thumb, species,
                                 photo_list, head, header, foot, write, paged, fit, bird_tile)

# Groups in taxonomic order: the subfamily, or its tribe where it has tribes. Colors as in the explorer.
GROUPS = [("Florisuginae", "#ff6a3d"), ("Phaethornithinae", "#c49d5f"), ("Polytminae", "#2fe0a0"),
          ("Lesbiini", "#1fae5b"), ("Heliantheini", "#7fd94a"), ("Patagoninae", "#c3d0de"),
          ("Lampornithini", "#ff5fbf"), ("Mellisugini", "#d59ae6"), ("Trochilini", "#9cc0ff")]
COLOR = dict(GROUPS)
RED = ["CR", "EN", "VU", "NT", "LC", "DD", "NE", "EX"]
group_of = lambda s: s["tribe"] if s["tribe"] != "—" else s["subfamily"]
world_n = Counter(group_of(s) for s in species)
masses = [s["mass"] for s in species if s["mass"]]
W_MIN, W_MAX = min(masses), max(masses)

# Countries and how many species each has, counted as the explorer's map does (every species listed there).
names, count, endemic_n = {}, Counter(), Counter()
for s in species:
    for d in s["dist"]:
        names[d["iso"]] = d["c"]
        count[d["iso"]] += 1
    if s["endemic"]:
        endemic_n[next(d["iso"] for d in s["dist"] if d["c"] == s["endemic"])] += 1


def dirs(L):
    return L.cdir


def page_url(L, iso):
    return f"{SITE}/{L.country_path(names[iso])}"


def group_label(L, g):
    return (L.tribe if g in L.tribe else L.clade)[g]


def ordinal(L, n):
    if L.es:
        return f"{n}.º"
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def presence(st):
    """How a species uses the country: lives or breeds there, only visits, or is rare/uncertain."""
    if FAINT.search(st):
        return "rare"
    if "Resident" in st or "Breeding" in st or st == "Present":
        return "lives"
    return "visits"


def sp_link(L, s, root):
    return f'{root}{L.dir}/{L.slug(s)}/'


def notable(here, iso):
    """Species to name first in the intro and description: those found only here, then the ones with the most
    eBird records in the country. Only species that live there count, unless the country has nothing but visitors."""
    lives = [x for x in here if presence(x[1]["st"]) == "lives"] or here
    by_records = lambda x: -(x[1]["n"] or 0)
    ends = sorted((x for x in lives if x[0]["endemic"] == names[iso]), key=by_records)
    rest = sorted((x for x in lives if x[0]["endemic"] != names[iso]), key=by_records)
    return [s for s, d in ends + rest]


def has_photo(s):
    return bool(photo_list(s))


def country_descriptions(L, cname, n, k, top, photos_line):
    """Description options, longest first: the count, the first species to name, and what the page shows."""
    if k:
        shows = L.t(f"scientific names and {'its 1 endemic' if k == 1 else f'the {k} endemics'}",
                    f"nombres científicos y {'su especie endémica' if k == 1 else f'las {k} especies endémicas'}")
    else:
        shows = L.t("scientific names", "nombres científicos")
    see = L.t(f"See {'photos, ' if photos_line else ''}{shows}.", f"{'Fotos, ' if photos_line else ''}{shows}.").replace(", scientific names.", " and scientific names.").replace(", nombres científicos.", " y nombres científicos.")
    see = see[0].upper() + see[1:]
    out = []
    for m in ((n,) if n <= 2 else (3, 2, 1)):
        names_ = L.and_list(L.the(s) for s in top[:m])
        if n <= 2:
            first = L.t(f"{n} hummingbird species are found in {cname}: {names_}.", f"En {cname} hay {n} especies de colibríes: {names_}.")
        else:
            first = L.t(f"{n} hummingbird species are found in {cname}, including {names_}.", f"En {cname} hay {n} especies de colibríes, como {names_}.")
        out += [f"{first} {see}", first]
    return [o for o in out if o.endswith(see)] + [o for o in out if not o.endswith(see)]


def country_page(iso, L):
    depth = dirs(L).count("/") + 2
    root = "../" * depth
    other = L_EN if L.es else L_ES
    cname = L.place(names[iso])
    up = lambda x: x[0].upper() + x[1:]
    here = sorted(((s, next(d for d in s["dist"] if d["iso"] == iso)) for s in species if any(d["iso"] == iso for d in s["dist"])),
                  key=lambda x: x[0]["seq"])
    n = len(here)
    only_here = lambda s: s["endemic"] == names[iso]
    ends = [s for s, d in here if only_here(s)]
    pres = {s["code"]: presence(d["st"]) for s, d in here}
    visitors = [s for s, d in here if pres[s["code"]] == "visits"]
    rare = [s for s, d in here if pres[s["code"]] == "rare"]
    threatened = [s for s, d in here if s["iucn"] in ("VU", "EN", "CR")]
    near = [s for s, d in here if s["iucn"] == "NT"]

    # Rank among all countries, ties shared.
    rank = 1 + sum(1 for v in count.values() if v > n)
    tied = [names[i] for i, v in count.items() if v == n and i != iso]
    e_rank = 1 + sum(1 for v in endemic_n.values() if v > len(ends))
    e_above = [names[i] for i, v in sorted(endemic_n.items(), key=lambda x: -x[1]) if v > len(ends)]

    # ---- Lede, built from the numbers only.
    firsts = notable(here, iso)
    two = L.and_list(e(L.the(s)) for s in firsts[:2])
    if n <= 2:
        lede = L.t(f"{n} of the world's {len(species)} hummingbird species live in or visit {e(cname)}: {two}.",
                   f"{n} de las {len(species)} especies de colibrí del mundo viven en {e(cname)} o lo visitan: {two}.")
    else:
        lede = L.t(f"{n} of the world's {len(species)} hummingbird species live in or visit {e(cname)}, among them {two}.",
                   f"{n} de las {len(species)} especies de colibrí del mundo viven en {e(cname)} o lo visitan, entre ellas {two}.")
    if ends:
        lede += " " + L.t(f"{len(ends)} of them {'is' if len(ends) == 1 else 'are'} found nowhere else on Earth.",
                          f"{len(ends)} de ellas no {'vive' if len(ends) == 1 else 'viven'} en ningún otro lugar del planeta.")
    if ends and e_rank <= 5:
        lede += " " + (L.t(f"Only {L.and_list(e(L.place(c)) for c in e_above)} {'has' if len(e_above) == 1 else 'have'} more species of their own.",
                           f"Solo {L.and_list(e(L.place(c)) for c in e_above)} {'tiene' if len(e_above) == 1 else 'tienen'} más especies propias.")
                       if e_above else L.t("No other country has more species of its own.", "Ningún otro país tiene más especies propias."))

    explorer = f"{root}{L.t('', 'es/')}?country={iso}"

    # ---- Number tiles.
    tiles = [(n, L.t("species", "especies"), L.t(f"{ordinal(L, rank)} of {len(count)} countries and territories", f"lugar {ordinal(L, rank)} de {len(count)} países y territorios")),
             (len(ends), L.t("found only here", "solo viven aquí"), L.t(f"{ordinal(L, e_rank)} most of any country", f"lugar {ordinal(L, e_rank)} entre todos los países") if ends else ""),
             (len(threatened), L.t("threatened", "amenazadas"), L.t("Vulnerable or worse", "Vulnerable o peor")),
             (len(visitors), L.t("only visit", "solo de visita"), L.t("winter visitors or passing migrants", "visitantes de invierno o de paso"))]
    tiles_html = "".join(f'<div class="tile"><b>{v}</b><span>{k}</span>{f"<small>{sub}</small>" if sub else ""}</div>' for v, k, sub in tiles)

    # ---- Family groups: this country against the world.
    by_g = Counter(group_of(s) for s, d in here)
    top = max(world_n.values())
    rows = []
    for g, col in GROUPS:
        k, w = by_g.get(g, 0), world_n[g]
        rows.append(f'<li class="{"none" if not k else ""}"><span class="gname"><i>{e(g)}</i> <em>{e(group_label(L, g))}</em></span>'
                    f'<span class="track" style="width:{w / top * 100:.1f}%"><span class="fill" style="width:{k / w * 100:.1f}%;background:{col}"></span></span>'
                    f'<span class="num">{k} <small>{L.t("of", "de")} {w}</small></span></li>')
    biggest = by_g.most_common(1)[0][0]
    missing = [group_label(L, g) for g, _ in GROUPS if not by_g.get(g)]
    groups_note = L.t(f"The biggest group here is the {e(group_label(L, biggest))}, with {by_g[biggest]} species.",
                      f"El grupo más grande aquí: {e(group_label(L, biggest))}, con {by_g[biggest]} especies.")
    if 1 <= len(missing) <= 4:
        groups_note += " " + L.t(f"No {e(L.and_list(missing).replace(' and ', ' or '))} live here.",
                                 f"Aquí no hay {e(L.and_list(missing).replace(' y ', ' ni '))}.")

    # ---- Ranking: the countries with the most species, with this one highlighted.
    order = sorted(count.items(), key=lambda x: (-x[1], L.country(names[x[0]])))
    shown = order[:10] if any(i == iso for i, _ in order[:10]) else order[:9] + [next(x for x in order if x[0] == iso)]
    rank_rows = "".join(
        f'<li class="{"me" if i == iso else ""}"><span class="cname">{e(L.country(names[i]))}</span>'
        f'<span class="track" style="width:100%"><span class="fill" style="width:{v / order[0][1] * 100:.1f}%"></span></span><span class="num">{v}</span></li>'
        for i, v in shown)
    tie_en = (f", tied with {e(L.and_list(L.place(c) for c in tied))}" if len(tied) <= 3 else f", tied with {len(tied)} others") if tied else ""
    tie_es = (f", empatado con {e(L.and_list(L.place(c) for c in tied))}" if len(tied) <= 3 else f", empatado con otros {len(tied)}") if tied else ""
    rank_note = L.t(f"{up(e(cname))} is {ordinal(L, rank)} of the {len(count)} countries and territories with hummingbirds{tie_en}. "
                    f'<a href="../">See how {e(cname)} ranks</a> against every country.',
                    f"{up(e(cname))} ocupa el lugar {ordinal(L, rank)} entre los {len(count)} países y territorios con colibríes{tie_es}. "
                    f'<a href="../">Ve cómo se compara {e(cname)}</a> con todos los países.')

    # ---- Endemics, with photos.
    tile = lambda s, note="": bird_tile(s, L, root, note)
    ends_html = (f'<h2>{L.t(f"Found only in {e(cname)}", f"Solo viven en {e(cname)}")} · {len(ends)}</h2><ul class="birds">{"".join(tile(s) for s in ends)}</ul>'
                 if ends else "")

    # ---- Red List.
    st_n = Counter(s["iucn"] if s["iucn"] != "NE" else "DD" for s, d in here)
    seg = "".join(f'<span style="flex:{st_n[k]};background:{STATUS_COLOR[k]}" title="{e(L.iucn[k])}: {st_n[k]}"></span>' for k in RED if st_n.get(k))
    legend = "".join(f'<li><i style="background:{STATUS_COLOR[k]}"></i>{e(L.iucn[k])} <b>{st_n[k]}</b></li>' for k in RED if st_n.get(k))
    at_risk = sorted(threatened + near, key=lambda s: RED.index(s["iucn"]))
    risk_html = "".join(f'<li><a href="{sp_link(L, s, root)}">{e(L.name(s))}</a><span class="st" style="--st:{STATUS_COLOR[s["iucn"]]}">{e(L.iucn[s["iucn"]])}'
                        f'{L.t(f" · only in {e(cname)}", f" · solo en {e(cname)}") if only_here(s) else ""}</span></li>' for s in at_risk)
    k = sum(1 for s in at_risk if only_here(s))
    red_note = (L.t(f"{len(threatened)} species here {'is' if len(threatened) == 1 else 'are'} threatened and {len(near)} {'is' if len(near) == 1 else 'are'} near threatened"
                    + (f"; {k} of them {'lives' if k == 1 else 'live'} only in {e(cname)}" if any(only_here(s) for s in at_risk) else "") + ".",
                    f"{len(threatened)} {'especie está amenazada' if len(threatened) == 1 else 'especies están amenazadas'} y {len(near)} {'está casi amenazada' if len(near) == 1 else 'están casi amenazadas'}"
                    + (f"; {k} de ellas solo {'vive' if k == 1 else 'viven'} en {e(cname)}" if any(only_here(s) for s in at_risk) else "") + ".")
                if at_risk else L.t("None of the species here is threatened.", "Ninguna de las especies de aquí está amenazada."))

    # ---- Sizes on a log scale, stacked like a dot plot.
    lo, hi = math.log(W_MIN * 0.95), math.log(W_MAX * 1.05)
    pos = lambda m: (math.log(m) - lo) / (hi - lo) * 100
    bins = Counter()
    dots = []
    for s, d in sorted(here, key=lambda x: x[0]["mass"] or 0):
        if not s["mass"]:
            continue
        b = round(pos(s["mass"]) / 2.2)
        # Not links: dots this small can't be tapped reliably, and every species is linked in the photo grid below.
        dots.append(f'<span class="dot" title="{e(L.name(s))}, {s["mass"]} g" '
                    f'style="left:{pos(s["mass"]):.2f}%;--k:{bins[b]};background:{COLOR[group_of(s)]}"></span>')
        bins[b] += 1
    ticks = "".join(f'<span style="left:{pos(t):.2f}%">{t} g</span>' for t in (2, 3, 5, 10, 20) if W_MIN <= t <= W_MAX)
    weighed = [s for s, d in here if s["mass"]]
    light, heavy = min(weighed, key=lambda s: s["mass"]), max(weighed, key=lambda s: s["mass"])
    scale = L.t(f"The scale covers the whole family, from {W_MIN} to {W_MAX} g.", f"La escala abarca toda la familia, de {W_MIN} a {W_MAX} g.")
    if light is heavy:
        size_note = L.t(f"{up(e(L.the(light)))} weighs {light['mass']} g. ", f"{up(e(L.the(light)))} pesa {light['mass']} g. ") + scale
    else:
        size_note = L.t(f"From {e(L.the(light))}, {light['mass']} g, to {e(L.the(heavy))}, {heavy['mass']} g. ",
                        f"Desde {e(L.the(light))}, de {light['mass']} g, hasta {e(L.the(heavy))}, de {heavy['mass']} g. ") + scale
    size_html = (f'<div class="sizes" style="--n:{max(bins.values())}"><div class="plot" role="img" aria-label="{L.t("Weights of the species here, on a log scale", "Pesos de las especies de aquí, en escala logarítmica")}">{"".join(dots)}</div><div class="axis">{ticks}</div></div>'
                 f'<p class="note-s">{size_note}</p>')

    # ---- Visitors and the full list.
    vis_html = ""
    if visitors or rare:
        items = "".join(f'<li><a href="{sp_link(L, s, root)}">{e(L.name(s))}</a> <small>{e(L.presence(d["st"]))}</small></li>'
                        for s, d in here if pres[s["code"]] != "lives")
        vis_html = (f'<h2>{L.t("Visitors", "Visitantes")} · {len(visitors) + len(rare)}</h2>'
                    f'<p>{L.t(f"These species don’t breed in {e(cname)}; they come for the winter, pass through on migration, or turn up rarely.", f"Estas especies no se reproducen en {e(cname)}: pasan aquí el invierno, lo cruzan durante la migración o aparecen muy de vez en cuando.")}</p>'
                    f'<ul class="rel">{items}</ul>')
    full = []
    for g, col in GROUPS:
        members = [(s, d) for s, d in here if group_of(s) == g]
        if not members:
            continue
        lis = "".join(tile(s, " · ".join(x for x in (L.t("only here", "solo aquí") if only_here(s) else "",
                                                       e(L.presence(d["st"])) if pres[s["code"]] != "lives" else "") if x))
                      for s, d in members)
        full.append(f'<h3><span class="sw" style="background:{col}"></span><i>{e(g)}</i> <em>{e(group_label(L, g))} · {len(members)}</em></h3><ul class="birds">{lis}</ul>')

    # ---- Page.
    url = page_url(L, iso)
    alternates = [("en", page_url(L_EN, iso)), ("es", page_url(L_ES, iso)), ("x-default", page_url(L_EN, iso))]
    title = L.t(f"Hummingbirds of {cname}: all {n} species", f"Colibríes de {cname}: las {n} especies")
    photos_line = any(has_photo(s) for s, d in here)
    title = fit(*([title + L.t(", with photos", " con fotos")] if photos_line else []), title + " · Hummingbirds World", title,
                L.t(f"Hummingbirds of {cname}: {n} species", f"Colibríes de {cname}: {n} especies"), limit=60)
    desc = fit(*country_descriptions(L, cname, n, len(ends), firsts, photos_line), limit=155)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "@id": url, "url": url, "name": title.split(" · ")[0], "inLanguage": L.code,
         "about": {"@type": "Country", "name": cname}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Hummingbirds World", "item": SITE + L.t("/", "/es/")},
            {"@type": "ListItem", "position": 2, "name": L.t("By country", "Por país"), "item": f"{SITE}/{L.cdir}/"},
            {"@type": "ListItem", "position": 3, "name": cname, "item": url}]}]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    other_href = root + f"{dirs(other)}/{slug(other.country(names[iso]))}/"

    return head(L, title, desc, url, alternates, root, None, extra) + header(L, root, other_href) + f"""<main class="sp ctry">
<nav class="crumbs" aria-label="{L.t('Breadcrumb', 'Ruta')}"><a href="{root}{L.t('', 'es/')}">Hummingbirds World</a> › <a href="../">{L.t('By country', 'Por país')}</a></nav>
<h1>{L.t(f'Hummingbirds of {e(cname)}', f'Colibríes de {e(cname)}')}</h1>
<p class="lede">{lede}</p>
<div class="tiles">{tiles_html}</div>
<p class="actions"><a class="btn" href="{explorer}">{L.t(f'See {e(cname)} in the explorer', f'Ver {e(cname)} en el explorador')}</a></p>

<h2>{L.t('Which hummingbirds', 'Qué colibríes')}</h2>
<p>{L.t(f'How many species of each group live in {e(cname)}, out of all the species in that group. Bar length shows the group’s size worldwide.', f'Cuántas especies de cada grupo viven en {e(cname)}, del total de especies del grupo. El largo de la barra muestra el tamaño del grupo en el mundo.')}</p>
<ul class="bars groups">{"".join(rows)}</ul>
<p class="note-s">{groups_note}</p>

<h2>{L.t('Compared with other countries', 'Comparado con otros países')}</h2>
<ul class="bars rank">{rank_rows}</ul>
<p class="note-s">{rank_note}</p>

{ends_html}

<h2>{L.t('Red List status', 'Estado en la Lista Roja')}</h2>
<div class="redbar">{seg}</div>
<ul class="legend">{legend}</ul>
<p>{red_note}</p>
{f'<ul class="rel risk">{risk_html}</ul>' if risk_html else ""}

<h2>{L.t('Sizes', 'Tamaños')}</h2>
{size_html}

{vis_html}

<h2>{L.t(f'All {n} species', f'Las {n} especies')}</h2>
<div class="idx">{"".join(full)}</div>

<h2>{L.t('Sources', 'Fuentes')}</h2>
<p class="sources">{L.t(
    'Countries and how each species uses them: BirdLife International DataZone, checked against eBird records via GBIF. The count includes every species on the country’s list, as the explorer’s map does. '
    'Groups: Dickinson &amp; Remsen (2013) and McGuire et al. (2014). Weight: AVONET (Tobias et al. 2022, CC BY 4.0). Red List status: BirdLife International, the IUCN Red List authority for birds.',
    'Países y cómo usa cada especie cada país: BirdLife International DataZone, comparado con registros de eBird a través de GBIF. El conteo incluye todas las especies de la lista del país, como el mapa del explorador. '
    'Grupos: Dickinson y Remsen (2013) y McGuire et al. (2014). Peso: AVONET (Tobias et al. 2022, CC BY 4.0). Estado en la Lista Roja: BirdLife International, la autoridad de la Lista Roja de la UICN para las aves.')}</p>
</main>
""" + foot(L, root)


SORT_JS = """<script>
// Sortable ranking: click a column heading to sort by it, click again to reverse.
document.querySelectorAll("table.sortable").forEach(function (t) {
  var body = t.tBodies[0];
  t.querySelectorAll("th button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var th = btn.parentNode, now = th.getAttribute("aria-sort");
      var dir = now === "ascending" ? "descending" : now === "descending" ? "ascending" : th.dataset.first;
      t.querySelectorAll("th").forEach(function (h) { h.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", dir);
      var col = th.cellIndex, num = th.dataset.type === "num", sign = dir === "ascending" ? 1 : -1;
      var val = function (r) { var c = r.cells[col]; return c.dataset.v !== undefined ? c.dataset.v : c.textContent; };
      Array.prototype.slice.call(body.rows).sort(function (x, y) {
        var r = num ? val(x) - val(y) : val(x).localeCompare(val(y), document.documentElement.lang);
        return sign * r || x.dataset.i - y.dataset.i;
      }).forEach(function (r) { body.appendChild(r); });
    });
  });
});
</script>
"""


def ranking_sentence(L, order, html_=True):
    """'Colombia has the most hummingbird species (166), followed by Ecuador (133) and Peru (130).'"""
    esc = e if html_ else (lambda x: x)
    (c1, n1), (c2, n2), (c3, n3) = [(esc(L.place(names[i])), v) for i, v in order[:3]]
    c1 = c1[0].upper() + c1[1:]
    return L.t(f"{c1} has the most hummingbird species ({n1}), followed by {c2} ({n2}) and {c3} ({n3}).",
               f"{c1} es el país con más especies de colibríes ({n1}), seguido de {c2} ({n2}) y {c3} ({n3}).")


def index_page(L):
    root = "../" * (L.cdir.count("/") + 1)
    other = L_EN if L.es else L_ES
    threat = Counter(d["iso"] for s in species if s["iucn"] in ("VU", "EN", "CR") for d in s["dist"])
    order = sorted(count.items(), key=lambda x: (-x[1], L.country(names[x[0]])))
    top = order[0][1]
    up = lambda x: x[0].upper() + x[1:]
    rows = []
    for k, (iso, v) in enumerate(order):
        c = names[iso]
        rank = 1 + sum(1 for w in count.values() if w > v)
        nm = (f'<a href="{root}{L.country_path(c)}">{e(L.country(c))}</a>' if L.country_path(c)
              else f'{e(L.country(c))} <small>{L.t("rare visitors only", "solo visitantes raros")}</small>')
        rows.append(f'<tr data-i="{k}"><td class="num" data-v="{rank}">{rank}</td><td data-v="{e(L.country(c))}">{nm}</td>'
                    f'<td class="num" data-v="{v}"><span class="bar" style="width:{v / top * 100:.1f}%"></span>{v}</td>'
                    f'<td class="num" data-v="{endemic_n.get(iso, 0)}">{endemic_n.get(iso) or "–"}</td>'
                    f'<td class="num" data-v="{threat.get(iso, 0)}">{threat.get(iso) or "–"}</td></tr>')
    th = lambda label, first, typ="num", sort="": (f'<th scope="col" data-type="{typ}" data-first="{first}"{sort}>'
                                                     f'<button type="button">{label}</button></th>')
    rank_th = th("#", "ascending", sort=' aria-sort="ascending"')
    table = (f'<table class="sortable ranking"><caption>{L.t("Countries and territories by number of hummingbird species. Select a column heading to sort.", "Países y territorios por número de especies de colibríes. Elige un encabezado para ordenar.")}</caption>'
             f'<thead><tr>{rank_th}'
             f'{th(L.t("Country", "País"), "ascending", "text")}{th(L.t("Species", "Especies"), "descending")}'
             f'{th(L.t("Only here", "Solo aquí"), "descending")}{th(L.t("Threatened", "Amenazadas"), "descending")}</tr></thead>'
             f'<tbody>{"".join(rows)}</tbody></table>')
    n_ctry = len(count)
    best_e = max(endemic_n, key=endemic_n.get)
    title = L.t("Which country has the most hummingbird species?", "¿Qué país tiene más especies de colibríes?")
    answer = ranking_sentence(L, order, html_=False)
    desc = fit(answer + L.t(f" All {n_ctry} countries and territories with hummingbirds, ranked.", f" Los {n_ctry} países y territorios con colibríes, por número de especies."),
               answer + L.t(f" All {n_ctry} countries, ranked.", f" Los {n_ctry} países, por número de especies."), answer, limit=155)
    lead, lead_e = up(e(L.place(names[order[0][0]]))), e(L.place(names[best_e]))
    if best_e == order[0][0]:
        most = L.t(f"{lead} also has the most species found nowhere else, {endemic_n[best_e]}. ",
                   f"{lead} también tiene más especies que no viven en ningún otro lugar, {endemic_n[best_e]}. ")
    else:
        most = L.t(f"{lead_e[0].upper() + lead_e[1:]} has the most found nowhere else, {endemic_n[best_e]}. ",
                   f"{lead_e[0].upper() + lead_e[1:]} tiene más especies que no viven en ningún otro lugar, {endemic_n[best_e]}. ")
    lede = (f"<strong>{ranking_sentence(L, order)}</strong> " + most
            + L.t(f"All {len(species)} hummingbird species live in the Americas, in {n_ctry} countries and territories. Open a country to see photos of every species there.",
                  f"Las {len(species)} especies de colibríes viven en América, en {n_ctry} países y territorios. Abre un país para ver fotos de cada especie que vive ahí."))
    alternates = [("en", f"{SITE}/countries/"), ("es", f"{SITE}/es/paises/"), ("x-default", f"{SITE}/countries/")]
    ranked = [(i, v) for i, v in order if L.country_path(names[i])]
    url = f"{SITE}/{L.cdir}/"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "ItemList", "name": title, "url": url, "inLanguage": L.code,
         "numberOfItems": len(ranked), "itemListOrder": "https://schema.org/ItemListOrderDescending",
         "itemListElement": [{"@type": "ListItem", "position": k, "url": f"{SITE}/{L.country_path(names[i])}",
                              "name": L.t(f"{L.country(names[i])}: {v} species", f"{L.country(names[i])}: {v} especies")}
                             for k, (i, v) in enumerate(ranked, 1)]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Hummingbirds World", "item": SITE + L.t("/", "/es/")},
            {"@type": "ListItem", "position": 2, "name": L.t("By country", "Por país"), "item": url}]}]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    return (head(L, title, desc, url, alternates, root, None, extra) + header(L, root, root + other.cdir + "/")
            + f"""<main class="sp ctry">
<nav class="crumbs" aria-label="{L.t('Breadcrumb', 'Ruta')}"><a href="{root}{L.t('', 'es/')}">Hummingbirds World</a> › {L.t('By country', 'Por país')}</nav>
<h1>{L.t('Hummingbirds by country', 'Colibríes por país')}</h1>
<p class="lede">{lede}</p>
<h2 id="ranking">{L.t('Countries ranked by number of species', 'Países por número de especies')}</h2>
<div class="table-wrap">{table}</div>
<h2>{L.t('Sources', 'Fuentes')}</h2>
<p class="sources">{L.t(
    'Countries: BirdLife International DataZone, checked against eBird records via GBIF. Each country counts every species on its list, including visitors, as the explorer’s map does. '
    'Threatened means Vulnerable, Endangered or Critically endangered on the IUCN Red List (BirdLife International).',
    'Países: BirdLife International DataZone, comparado con registros de eBird a través de GBIF. Cada país cuenta todas las especies de su lista, incluidas las visitantes, como el mapa del explorador. '
    'Amenazadas significa Vulnerable, En peligro o En peligro crítico en la Lista Roja de la UICN (BirdLife International).')}</p>
</main>
{SORT_JS}""" + foot(L, root))


if __name__ == "__main__":
    only = set(sys.argv[1:]) or {i for i, c in names.items() if c in paged}
    changed = 0
    for L in (L_EN, L_ES):
        for iso in sorted(only):
            changed += write(APP / L.country_path(names[iso]) / "index.html", country_page(iso, L))
        changed += write(APP / L.cdir / "index.html", index_page(L))
    if not sys.argv[1:]:
        import build_sitemap
        changed += build_sitemap.build()
    print(f"{len(only)} countries × 2 languages, indexes, sitemap.xml; {changed} files changed")
