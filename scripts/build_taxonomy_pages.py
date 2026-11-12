"""Write one page per subfamily, tribe and genus (genera with two or more species) in English and Mexican Spanish:
which species belong to it, with photos, and where they live.

Like the species and country pages, everything is calculated from the public data files the site already uses
(app/species.json and the photo lists), plus the genus notes Lia approved (app/traits.js, Spanish in app/i18n.js).
Genera with a single species have no page: the species page already says everything.

    English:  app/taxonomy/<name>/      Spanish:  app/es/taxonomia/<name>/      (the Latin name, lowercased)

Run from the website repo folder (needs Python 3.12+ and Node) after build_species_pages.py and before
build_country_pages.py (which writes sitemap.xml last):
    python3 scripts/build_taxonomy_pages.py
"""
import json, sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_species_pages import (APP, SITE, FAINT, ESD, NOTES_EN, L_EN, L_ES, e, species, by_genus, tax_paged,
                                 head, header, foot, write, fit, breadcrumbs, bird_tile)

RANKS = {"subfamily": ("subfamily", "subfamilia"), "tribe": ("tribe", "tribu"), "genus": ("genus", "género")}


def rank_of(name):
    if any(s["subfamily"] == name for s in species):
        return "subfamily"
    if any(s["tribe"] == name for s in species):
        return "tribe"
    return "genus"


def members(name):
    return sorted((s for s in species if name in (s["subfamily"], s["tribe"], s["genus"])), key=lambda s: s["seq"])


def parents(name):
    """The groups above this one, from the subfamily down (a species' lineage, cut before this group)."""
    s = members(name)[0]
    line = [s["subfamily"]] + ([s["tribe"]] if s["tribe"] != "—" else []) + [s["genus"]]
    return line[:line.index(name)]


def informal(L, name, rank):
    """'bees', 'coquettes', or for a genus the names its species go by ('pufflegs'); '' if there is none."""
    if rank == "subfamily":
        return L.clade[name]
    if rank == "tribe":
        return L.tribe[name]
    return ", ".join(L.called(by_genus[name]))


def page_url(L, name):
    return f"{SITE}/{L.tax_path(name)}"


def group_page(name, L):
    rank = rank_of(name)
    rank_w = L.t(*RANKS[rank])
    root = "../" * (L.tdir.count("/") + 2)
    other = L_ES if not L.es else L_EN
    sp = members(name)
    n = len(sp)
    nick = informal(L, name, rank)
    genera = list(dict.fromkeys(s["genus"] for s in sp))
    up = lambda x: x[0].upper() + x[1:]

    # Countries: every country on the species' lists, as the country pages count them.
    per_country = Counter(d["c"] for s in sp for d in s["dist"])
    endemics = [s for s in sp if s["endemic"]]
    threatened = [s for s in sp if s["iucn"] in ("VU", "EN", "CR")]
    records = lambda s: -sum(d["n"] or 0 for d in s["dist"])
    best_known = sorted(sp, key=records)

    # ---- Lede, built from the numbers only.
    nick_en = f", the {e(nick)}," if nick and rank != "genus" else ""
    nick_es = f" ({e(nick)})" if nick and rank != "genus" else ""   # no article: los brillantes, las coquetas
    above = parents(name)
    within_en = (" in " + " of ".join(f"the {RANKS[rank_of(p)][0]} <i>{e(p)}</i>" for p in reversed(above))) if above else ""
    within_es = (" de " + " de ".join(f"la {RANKS[rank_of(p)][1]} <i>{e(p)}</i>" for p in reversed(above))) if above else ""
    sp_en = "1 species" if n == 1 else f"{n} species"
    sp_es = "1 especie" if n == 1 else f"{n} especies"
    gen_en = f" in {len(genera)} genera" if len(genera) > 1 else ""
    gen_es = f" en {len(genera)} géneros" if len(genera) > 1 else ""
    if rank == "genus":
        lede = L.t(f"<i>{e(name)}</i> is a genus of {sp_en} of hummingbirds{f' (the {e(nick)})' if nick else ''}{within_en}.",
                   f"<i>{e(name)}</i> es un género de colibríes con {sp_es}{f' ({e(nick)})' if nick else ''}{within_es}.")
    else:
        lede = L.t(f"<i>{e(name)}</i>{nick_en} is a {rank_w} of hummingbirds with {sp_en}{gen_en}{',' + within_en.replace(' in ', ' part of ', 1) if above else ''}.",
                   f"<i>{e(name)}</i>{nick_es} es una {rank_w} de colibríes con {sp_es}{gen_es}{',' + within_es.replace(' de ', ' dentro de ', 1) if above else ''}.")
    nc = len(per_country)
    where = L.t(f" {'It is' if n == 1 else 'They are'} found in {nc} {'country' if nc == 1 else 'countries'}",
                f" {'Vive' if n == 1 else 'Viven'} en {nc} {'país' if nc == 1 else 'países'}")
    if n >= 5 and nc >= 3:
        top3 = per_country.most_common(3)
        where += L.t(f"; the most live in {L.and_list(f'{e(L.place(c))} ({k})' for c, k in top3)}.",
                     f"; donde más hay es en {L.and_list(f'{e(L.place(c))} ({k})' for c, k in top3)}.")
    else:
        where += "."
    lede += where
    if n > 1 and endemics:
        lede += L.t(f" {len(endemics)} {'is' if len(endemics) == 1 else 'are'} found in only one country.",
                    f" {len(endemics)} {'vive' if len(endemics) == 1 else 'viven'} en un solo país.")
    if n > 1:
        t = len(threatened)
        lede += (L.t(f" {t} {'is' if t == 1 else 'are'} threatened on the IUCN Red List.",
                     f" {t} {'está amenazada' if t == 1 else 'están amenazadas'} según la Lista Roja de la UICN.") if t
                 else L.t(" None is threatened on the IUCN Red List.", " Ninguna está amenazada según la Lista Roja de la UICN."))

    # ---- Genus note (written for the site and checked by Lia).
    note = ""
    if rank == "genus":
        gnote = (ESD["notes"] if L.es else NOTES_EN)["genus"].get(name)
        if gnote:
            note = f'<p class="note"><b>{L.t(f"What <i>{e(name)}</i> share:", f"Lo que tienen en común los <i>{e(name)}</i>:")}</b> {e(gnote)}</p>'

    # ---- Groups inside this one.
    link = lambda g: f'<a href="{root}{L.tax_path(g)}"><i>{e(g)}</i></a>' if L.tax_path(g) else f"<i>{e(g)}</i>"
    count_w = lambda k: L.t("1 species" if k == 1 else f"{k} species", "1 especie" if k == 1 else f"{k} especies")
    kids_html = ""
    if rank == "subfamily":
        tribes = list(dict.fromkeys(s["tribe"] for s in sp if s["tribe"] != "—"))
        if tribes:
            kids_html += (f'<h2>{L.t("Tribes", "Tribus")} · {len(tribes)}</h2><ul class="kids">'
                          + "".join(f'<li>{link(tr)} <small>{e(L.tribe[tr])} · {count_w(sum(1 for s in sp if s["tribe"] == tr))}</small></li>' for tr in tribes)
                          + "</ul>")
    if rank != "genus":
        kids_html += (f'<h2>{L.t("Genera", "Géneros")} · {len(genera)}</h2><ul class="kids">'
                      + "".join(f'<li>{link(g)} <small>{count_w(len(by_genus[g]))}</small></li>' for g in genera) + "</ul>")

    # ---- Species, with photos, by genus.
    tiles = []
    for g in genera:
        gsp = [s for s in sp if s["genus"] == g]
        note_for = lambda s: L.t(f"only in {e(L.place(s['endemic']))}", f"solo en {e(L.place(s['endemic']))}") if s["endemic"] else ""
        if rank != "genus":
            tiles.append(f'<h3>{link(g)} <em>{count_w(len(gsp))}</em></h3>')
        tiles.append(f'<ul class="birds">{"".join(bird_tile(s, L, root, note_for(s)) for s in gsp)}</ul>')

    # ---- Head.
    nick_t = up(nick) if nick and not L.es else nick
    count_t = L.t("1 Hummingbird Species" if n == 1 else f"{n} Hummingbird Species", "1 especie de colibrí" if n == 1 else f"{n} especies de colibríes")
    sep = L.t(" – ", ": ")
    title = fit(*([f"{name} ({nick_t}){sep}{count_t}"] if nick_t else []), f"{name}{sep}{count_t}", limit=60)
    names_ = lambda k: L.and_list(L.the(s) for s in best_known[:k])
    descs = []
    for k in ((3, 2, 1) if n >= 3 else (n,)):
        if rank == "genus":
            first = L.t(f"{name} is a genus of {n} hummingbird species", f"{name} es un género de colibríes con {sp_es}")
        else:
            first = L.t(f"{name}{f', the {nick},' if nick else ''} is a {rank_w} of {n} hummingbird species",
                        f"{name}{f' ({nick})' if nick else ''} es una {rank_w} de colibríes con {sp_es}")
        first += L.t(f": {names_(k)}." if n <= 3 and k == n else f", including {names_(k)}.",
                     f": {names_(k)}." if n <= 3 and k == n else f", como {names_(k)}.")
        descs += [first + L.t(" See photos, scientific names and where each lives.", " Fotos, nombres científicos y dónde vive cada una."),
                  first + L.t(" See photos and where each lives.", " Fotos y dónde vive cada una."),
                  first + L.t(" See photos.", " Con fotos.")]
    descs += [d.split(". ")[0] + "." for d in descs]
    desc = fit(*descs, limit=155)

    url = page_url(L, name)
    alternates = [("en", page_url(L_EN, name)), ("es", page_url(L_ES, name)), ("x-default", page_url(L_EN, name))]
    taxon = {"@type": "Taxon", "@id": url + "#taxon", "name": name, "taxonRank": rank, "url": url, "inLanguage": L.code,
             **({"alternateName": nick} if nick else {}),
             **({"parentTaxon": {"@type": "Taxon", "name": above[-1], "taxonRank": rank_of(above[-1]), "url": page_url(L, above[-1])}} if above
                else {"parentTaxon": {"@type": "Taxon", "name": "Trochilidae", "taxonRank": "family"}})}
    ld = {"@context": "https://schema.org", "@graph": [
        taxon,
        breadcrumbs(L, [(L.t("All species", "Todas las especies"), f"{SITE}/{L.dir}/")]
                    + [(p, page_url(L, p)) for p in above] + [(name, url)])]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    crumbs = "".join(f" › {link(p)}" for p in above)
    alt = " · ".join(x for x in (L.t(up(rank_w), up(rank_w)), e(nick), L.t(f"family <i>Trochilidae</i>", f"familia <i>Trochilidae</i>")) if x)

    return head(L, title, desc, url, alternates, root, None, extra) + header(L, root, root + other.tax_path(name)) + f"""<main class="sp ctry idx">
<nav class="crumbs" aria-label="{L.t('Breadcrumb', 'Ruta')}"><a href="{root}{L.dir}/">{L.t('All species', 'Todas las especies')}</a>{crumbs}</nav>
<h1><i>{e(name)}</i></h1>
<p class="alt">{alt}</p>
<p class="lede">{lede}</p>
{note}
{kids_html}
<h2>{L.t(f'All {n} species', f'Las {n} especies') if n > 1 else L.t('Its species', 'Su especie')}</h2>
{"".join(tiles)}

<h2>{L.t('Sources', 'Fuentes')}</h2>
<p class="sources">{L.t(
    'Names: eBird/Clements Checklist (Cornell Lab of Ornithology). Subfamilies and tribes: Dickinson &amp; Remsen (2013) and McGuire et al. (2014). '
    'Countries: BirdLife International DataZone, checked against eBird records via GBIF; every species on a country’s list counts, as on the country pages. '
    'Red List status: BirdLife International, the IUCN Red List authority for birds. Species named first are those with the most eBird records.',
    'Nombres: eBird/Clements Checklist (Cornell Lab of Ornithology), con los nombres en español de eBird México. Subfamilias y tribus: Dickinson y Remsen (2013) y McGuire et al. (2014). '
    'Países: BirdLife International DataZone, comparado con registros de eBird a través de GBIF; cuenta cada especie de la lista del país, como en las páginas de países. '
    'Estado en la Lista Roja: BirdLife International, la autoridad de la Lista Roja de la UICN para las aves. Las especies mencionadas primero son las que tienen más registros en eBird.')}</p>
</main>
""" + foot(L, root)


def ordered_groups():
    """Taxonomic order: each subfamily, then its tribes, then its genera."""
    out = []
    for s in sorted(species, key=lambda x: x["seq"]):
        for g in (s["subfamily"], s["tribe"], s["genus"]):
            if g in tax_paged and g not in out:
                out.append(g)
    return out


if __name__ == "__main__":
    groups = ordered_groups()
    changed = 0
    for L in (L_EN, L_ES):
        for g in groups:
            changed += write(APP / L.tax_path(g) / "index.html", group_page(g, L))
    print(f"{len(groups)} groups × 2 languages; {changed} files changed")
