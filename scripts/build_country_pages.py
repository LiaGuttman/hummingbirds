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
                                 photo_list, head, header, foot, write, paged)

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
    lede = L.t(f"{n} of the world's 363 hummingbird species live in or visit {e(cname)}, ",
               f"{n} de las 363 especies de colibrí del mundo viven en {e(cname)} o lo visitan, ")
    if ends:
        lede += L.t(f"and {len(ends)} of them {'is' if len(ends) == 1 else 'are'} found nowhere else on Earth.",
                    f"y {len(ends)} de ellas no {'vive' if len(ends) == 1 else 'viven'} en ningún otro lugar del planeta.")
    else:
        lede = lede.rstrip(", ") + "."
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
                    f'<a href="../">See them all</a>.',
                    f"{up(e(cname))} ocupa el lugar {ordinal(L, rank)} entre los {len(count)} países y territorios con colibríes{tie_es}. "
                    f'<a href="../">Verlos todos</a>.')

    # ---- Endemics, with photos.
    def tile(s):
        ph = (photo_list(s) or [None])[0]
        if ph:
            src = thumb(ph["src"], 500) if ph["src"].startswith("http") else root + ph["src"]
            img = f'<img src="{e(src)}" alt="{e(L.name(s))}" width="{ph.get("w", 4)}" height="{ph.get("h", 3)}" loading="lazy">'
            cr = f'<small class="cr">{e(ph.get("artist"))} · {e(L.t(ph.get("license"), "Todos los derechos reservados") if ph.get("license") == "All rights reserved" else ph.get("license"))}</small>'
        else:
            img, cr = f'<span class="nopic">{L.t("No free photo yet", "Aún sin foto libre")}</span>', ""
        return (f'<li><a href="{sp_link(L, s, root)}"><span class="pic">{img}</span><span class="nm">{e(L.name(s))}</span></a>'
                f'<span class="st" style="--st:{STATUS_COLOR.get(s["iucn"])}">{e(L.iucn.get(s["iucn"]))}</span>{cr}</li>')
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
        dots.append(f'<a class="dot" href="{sp_link(L, s, root)}" title="{e(L.name(s))}, {s["mass"]} g" '
                    f'style="left:{pos(s["mass"]):.2f}%;--k:{bins[b]};background:{COLOR[group_of(s)]}"></a>')
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
    size_html = (f'<div class="sizes" style="--n:{max(bins.values())}"><div class="plot">{"".join(dots)}</div><div class="axis">{ticks}</div></div>'
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
        lis = "".join(f'<li><a href="{sp_link(L, s, root)}">{e(L.name(s))}</a>'
                      + (f' <small>{L.t("only here", "solo aquí")}</small>' if only_here(s) else "")
                      + (f' <small>{e(L.presence(d["st"]))}</small>' if pres[s["code"]] != "lives" else "") + "</li>" for s, d in members)
        full.append(f'<h3><span class="sw" style="background:{col}"></span><i>{e(g)}</i> <em>{e(group_label(L, g))} · {len(members)}</em></h3><ul class="list">{lis}</ul>')

    # ---- Page.
    url = page_url(L, iso)
    alternates = [("en", page_url(L_EN, iso)), ("es", page_url(L_ES, iso)), ("x-default", page_url(L_EN, iso))]
    title = L.t(f"Hummingbirds of {cname}: all {n} species · Hummingbirds World", f"Colibríes de {cname}: las {n} especies · Hummingbirds World")
    desc = L.t(f"All {n} hummingbird species of {cname}, including {len(ends)} found nowhere else: how they fit in the family, their Red List status and their sizes.",
               f"Las {n} especies de colibrí de {cname}, entre ellas {len(ends)} que no viven en ningún otro lugar: su lugar en la familia, su estado en la Lista Roja y sus tamaños.")
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


def index_page(L):
    root = "../" * (L.cdir.count("/") + 1)
    other = L_EN if L.es else L_ES
    threat = Counter(d["iso"] for s in species if s["iucn"] in ("VU", "EN", "CR") for d in s["dist"])
    order = sorted(count.items(), key=lambda x: (-x[1], L.country(names[x[0]])))
    top = order[0][1]
    up = lambda x: x[0].upper() + x[1:]
    rows = []
    for iso, v in order:
        c = names[iso]
        nm = f'<a href="{root}{L.country_path(c)}">{e(L.country(c))}</a>' if L.country_path(c) else f'{e(L.country(c))} <small>{L.t("rare visitors only", "solo visitantes raros")}</small>'
        rows.append(f'<li><span class="cname">{nm}</span><span class="track"><span class="fill" style="width:{v / top * 100:.1f}%"></span></span>'
                    f'<span class="num">{v}</span><span class="num">{endemic_n.get(iso) or "–"}</span><span class="num">{threat.get(iso) or "–"}</span></li>')
    head_row = (f'<li class="hd"><span class="cname"></span><span></span><span class="num">{L.t("Species", "Especies")}</span>'
                f'<span class="num">{L.t("Only here", "Solo aquí")}</span><span class="num">{L.t("Threatened", "Amenazadas")}</span></li>')
    n_ctry = len(count)
    best_e = max(endemic_n, key=endemic_n.get)
    title = L.t("Hummingbirds by country · Hummingbirds World", "Colibríes por país · Hummingbirds World")
    desc = L.t(f"All {n_ctry} countries and territories with hummingbirds, ranked by number of species, with their endemic and threatened species.",
               f"Los {n_ctry} países y territorios con colibríes, ordenados por número de especies, con sus especies endémicas y amenazadas.")
    lead, lead_e = up(e(L.place(names[order[0][0]]))), e(L.place(names[best_e]))
    if best_e == order[0][0]:
        most = L.t(f"{lead} has both the most species, {top}, and the most found nowhere else, {endemic_n[best_e]}. ",
                   f"{lead} tiene a la vez más especies, {top}, y más especies que no viven en ningún otro lugar, {endemic_n[best_e]}. ")
    else:
        most = L.t(f"{lead} has the most species, {top}, and {lead_e} the most found nowhere else, {endemic_n[best_e]}. ",
                   f"{lead} tiene más especies, {top}, y {lead_e} más especies que no viven en ningún otro lugar, {endemic_n[best_e]}. ")
    lede = (L.t(f"The 363 hummingbird species live in {n_ctry} countries and territories, all of them in the Americas. ",
                f"Las 363 especies de colibrí viven en {n_ctry} países y territorios, todos en América. ") + most
            + L.t("Open a country to see which hummingbirds live there and how they compare.",
                  "Abre un país para ver qué colibríes viven ahí y cómo se comparan."))
    alternates = [("en", f"{SITE}/countries/"), ("es", f"{SITE}/es/paises/"), ("x-default", f"{SITE}/countries/")]
    return (head(L, title, desc, f"{SITE}/{L.cdir}/", alternates, root) + header(L, root, root + other.cdir + "/")
            + f"""<main class="sp ctry">
<nav class="crumbs" aria-label="{L.t('Breadcrumb', 'Ruta')}"><a href="{root}{L.t('', 'es/')}">Hummingbirds World</a> › {L.t('By country', 'Por país')}</nav>
<h1>{L.t('Hummingbirds by country', 'Colibríes por país')}</h1>
<p class="lede">{lede}</p>
<ul class="bars ctab">{head_row}{"".join(rows)}</ul>
<h2>{L.t('Sources', 'Fuentes')}</h2>
<p class="sources">{L.t(
    'Countries: BirdLife International DataZone, checked against eBird records via GBIF. Each country counts every species on its list, including visitors, as the explorer’s map does. '
    'Threatened means Vulnerable, Endangered or Critically endangered on the IUCN Red List (BirdLife International).',
    'Países: BirdLife International DataZone, comparado con registros de eBird a través de GBIF. Cada país cuenta todas las especies de su lista, incluidas las visitantes, como el mapa del explorador. '
    'Amenazadas significa Vulnerable, En peligro o En peligro crítico en la Lista Roja de la UICN (BirdLife International).')}</p>
</main>
""" + foot(L, root))


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
