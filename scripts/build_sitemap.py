"""Write sitemap.xml: every species and country page in English and Spanish, with hreflang pairs.

Each page's <lastmod> is the day its file last really changed: today if it differs from the last commit
(or is new), otherwise the date of the last commit that touched it. Search engines use lastmod to decide
what to re-crawl, so it must not be "today" for pages that didn't change.
build_country_pages.py runs this at the end, after every page is written. On its own:
    python3 scripts/build_sitemap.py
"""
import subprocess, sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_species_pages import APP, SITE, L_EN, L_ES, species, paged, write


def git(*args):
    try:
        return subprocess.run(["git", "-C", str(APP), *args], capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return ""


def last_changed():
    """{repo path: YYYY-MM-DD}: last commit date per file; today for files changed since the last commit."""
    dates, current = {}, None
    for line in git("log", "--format=@%cs", "--name-only", "--no-renames").splitlines():
        if line.startswith("@"):
            current = line[1:]
        elif line and line not in dates:
            dates[line] = current
    today = date.today().isoformat()
    for line in git("status", "--porcelain", "--untracked-files=all").splitlines():
        dates[line[3:].strip('"')] = today
    return dates


def build():
    dates, today = last_changed(), date.today().isoformat()

    def lastmod(url):
        path = url[len(SITE) + 1:] + "index.html"
        return dates.get(path, today)

    pairs = [(f"{SITE}/", f"{SITE}/es/"), (f"{SITE}/species/", f"{SITE}/es/especies/")]
    pairs += [(L_EN.url(s), L_ES.url(s)) for s in sorted(species, key=lambda x: x["seq"])]
    pairs += [(f"{SITE}/countries/", f"{SITE}/es/paises/")]
    pairs += [(f"{SITE}/{L_EN.country_path(c)}", f"{SITE}/{L_ES.country_path(c)}") for c in sorted(paged, key=L_EN.country)]
    rows = []
    for en, es in pairs:
        alt = (f'<xhtml:link rel="alternate" hreflang="en" href="{en}"/><xhtml:link rel="alternate" hreflang="es" href="{es}"/>'
               f'<xhtml:link rel="alternate" hreflang="x-default" href="{en}"/>')
        rows += [f"  <url><loc>{u}</loc><lastmod>{lastmod(u)}</lastmod>{alt}</url>\n" for u in (en, es)]
    return write(APP / "sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
                 + "".join(rows) + "</urlset>\n")


if __name__ == "__main__":
    print(f"sitemap.xml: {build()} files changed")
