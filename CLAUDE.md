# Hummingbirds World

Lia Guttman's explorer of all 363 hummingbird species, live at https://hummingbirds.world (GitHub Pages from `main`; a push is live in about a minute).

- **Accuracy first:** never invent facts about birds (sizes, ranges, counts, superlatives). Every fact needs a source that was actually opened; if the data doesn't have it, ask Lia.
- **Private data:** `scripts/build_public_data.py` reads `../data/species.json` on Lia's Mac, which holds her sightings (`seen`, `seen_date`, `seen_loc`). Never publish those fields or GPS from her photos. Edit the public `species.json` only through that script's FIXES tables.
- **Generated pages:** `species/`, `countries/`, `es/` and `sitemap.xml` are built by `scripts/` (Python 3.12+, Node). Change the scripts, then run `sh scripts/build_all.sh`; never hand-edit generated HTML. On Lia's Mac a pre-commit hook runs the same scripts.
- **SEO setup:** titles ≤60 and descriptions ≤155 characters (templates in `build_species_pages.py` and `build_country_pages.py`); `lastmod` comes from git history (`scripts/build_sitemap.py`); `.github/workflows/indexnow.yml` sends changed pages to Bing after each push.
- **After changing js/css:** bump the `?v=` tags in `index.html`, then run `scripts/build_spanish.py`.
- **Spanish:** Mexican Spanish, names from eBird Mexico. Western Emerald keeps its English name on purpose (eBird Mexico uses "Esmeralda Occidental" for another species).
- **Language:** reply in the language Lia writes in (English or Hebrew).
