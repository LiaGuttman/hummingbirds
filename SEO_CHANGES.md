# SEO changes — November 2026

What changed for the tasks in `SEO_TASKS.md`, with before/after examples, data gaps and the manual steps that need Lia.
Every number on the pages is computed from `species.json` and the photo lists at build time; no counts or facts were added by hand.
Built with `sh scripts/build_all.sh`. Never edit the generated pages directly.

## Files changed

| File | What |
|---|---|
| `scripts/build_country_pages.py` | Country page descriptions, intro sentence, photo grid of every species, “See how X ranks” link; `/countries/` and `/es/paises/` reworked as the ranking page |
| `scripts/build_species_pages.py` | Species title pattern, intro sentence (genus, number of countries, endemic status), links to subfamily, tribe and genus pages, shared photo tile with credit and license, breadcrumbs, footer link to the ranking, `llms.txt` |
| `scripts/build_taxonomy_pages.py` (new) | Subfamily, tribe and genus pages, English and Spanish |
| `scripts/build_sitemap.py`, `scripts/build_all.sh` | Taxonomy pages in the sitemap and in the build (order: species → taxonomy → countries, which writes the sitemap last) |
| `index.html`, `scripts/build_spanish.py` | Homepage title, description and intro card (EN + ES) |
| `style.css` (`?v=2026-11-12a`), `species.css` (`VERSION = 2026-11-12b`) | Intro card; ranking table; photo grid; 44px tap targets on phones |

If the pre-commit hook on your Mac lists the scripts one by one instead of calling `build_all.sh`, add `python3 scripts/build_taxonomy_pages.py` after `build_species_pages.py`.

## Task 1 — Country pages

- **Titles:** they already had the count, so they keep the same pattern. “, with photos” / “ con fotos” is added when it fits in 60 characters and the page has photos (now every page, see the photo grid). Long names fall back to the old forms. N = 1 grammar is handled, though no country with its own page has fewer than 2 species.
- **Descriptions** (≤155 characters, both languages) now give the count, name two or three species, and say what the page shows. Endemics are mentioned only when the country has any (“…and the 18 endemics”). Species named first are: endemics first, then the species with the most eBird records in that country (the `n` field), counting only species that live there, not visitors. This is a ranking by records, so the text never says “most common”.
  - EN wording: “{N} hummingbird species are found in {Country}…”. This is accurate for visitors too, which the count includes, as on the explorer’s map. 40 of 50 English descriptions name two species. The other 10 name one, because the names are long.
- **H1** unchanged: “Hummingbirds of {Country}” / “Colibríes de {País}”.
- **Intro sentence** now names one or two species: “3 of the world's 363 hummingbird species live in or visit Barbados, among them the Green-throated Carib and the Antillean Crested Hummingbird.”
- **Photo grid:** the “All N species” section shows a photo tile for every species: photo, common name, scientific name, Red List status, “only here” or visitor note, and photo credit. The 9 species without a free photo show “No free photo yet”. Images are lazy-loaded.
- “Anna's Hummingbird” and other possessive names no longer get “the” in generated sentences, on every page.

## Task 2 — Ranking (on `/countries/` and `/es/paises/`, no new page)

- Opens with the answer computed from the data, in bold: **“Colombia has the most hummingbird species (166), followed by Ecuador (133) and Peru (130).”** / **“Colombia es el país con más especies de colibríes (166), seguido de Ecuador (133) y Perú (130).”**
- A sortable `<table>` (`#ranking`) with columns rank (ties share a rank), country (linked), species, found only here (endemics) and threatened. Column headings are buttons with `aria-sort`, and the table works without JS (ranked order).
- ES title now asks the same question: “¿Qué país tiene más especies de colibríes?”.
- Linked from each country page (“See how {Country} ranks against every country” / “Ve cómo se compara…”), from the footer of every generated page (“Which country has the most?”) and from the homepage intro.
- JSON-LD: ItemList and BreadcrumbList.

## Task 3 — Species pages

- **Title:** `{Common name} ({Scientific name}) – Range & Facts` / `{Nombre} ({científico}) – distribución y datos`. Where that is over 60 characters, it falls back to `{Name} ({Scientific name})`. The full pattern fits on 194 of 363 English and 77 of 363 Spanish pages (Spanish names are longer).
- **Intro sentence** now has scientific name, genus, subfamily/tribe, number of countries and endemic status, e.g. “The Giant Hummingbird (*Patagona gigas*) is a hummingbird of the genus *Patagona*, in the subfamily *Patagoninae* (Patagona). … It lives in 6 countries: Chile, Peru, Ecuador, Bolivia, Argentina and Colombia.” Endemics: “It is endemic to Cuba: it is found nowhere else.”
- The scientific name stays right under the H1, as before.
- Links to every country page where it occurs (unchanged). Breadcrumbs and “Its place in the family” now link to the subfamily, tribe and genus pages. Under the up-to-10 relatives there is an “All species of {genus/tribe}” link.
- BreadcrumbList: Home › All species › subfamily › tribe › genus › species.

## Task 4 — Taxonomy pages (new)

`/taxonomy/<name>/` and `/es/taxonomia/<name>/`: 6 subfamilies, 5 tribes and the 72 genera with two or more species (83 pages per language). The 40 single-species genera have no page; their species page covers them.
Each page has:
- Title: `Mellisugini (Bees) – 37 Hummingbird Species` / `Lesbiini (coquetas): 67 especies de colibríes`.
- Intro computed from the data: number of species and genera, the group above it, in how many countries they live and the three countries with the most, how many are endemic to one country, and how many are threatened.
- Your approved “What X share” note on genus pages.
- Lists of tribes and genera, and photo tiles of every species grouped by genus.
- JSON-LD Taxon and BreadcrumbList, hreflang pairs, and an entry in the sitemap.

## Task 5 — Homepage

- Title: “Hummingbirds of the World – Every Species, by Country” / “Colibríes del mundo: todas las especies, por país”.
- Description: “All 363 hummingbird species in one explorer: family tree, world map, sizes and Red List status. Browse every species by country, with photos.”
- **Intro card** at the bottom left: a 2-sentence intro with links to *by country*, *which country has the most* and the *full species list*.
  - It closes with × (remembered in `localStorage`, so returning visitors don't see it) or on the first tap on the flock.
  - It doesn't show when the page opens on a deep link (`?species=`, `?country=`).
  - It hides while a species card is open.
  - The Spanish version is generated by `build_spanish.py`.
- The WebSite JSON-LD was already there.

## Task 6 — Technical

- **Canonical:** every one of the 998 pages has exactly one `<link rel="canonical">` to its own `https://` URL with a trailing slash (checked by script).
- **HTTPS — needs Lia:** I couldn't check from here how `http://hummingbirds.world/` responds (the sandbox blocks outside requests). In GitHub → repo **Settings → Pages**, make sure **Enforce HTTPS** is ticked. If it is greyed out, remove and re-add the custom domain to renew the certificate. Then in Search Console the `http://` property / URL-prefix version can be ignored.
- **hreflang:** every page has `en`, `es` and `x-default` (pointing to EN), and every pair links back to the other. Checked for all 998 pages, including the new ones.
- **JSON-LD:**
  - BreadcrumbList on all country, species, taxonomy and index pages.
  - WebSite on the homepage (both languages).
  - No FAQ markup.
  - All blocks parse as JSON, breadcrumb positions are sequential, and every breadcrumb URL is a real page.
- **Sitemap:** 998 URLs = every page on disk, each with hreflang alternates. `lastmod` still comes from git history. `robots.txt` points to it.
- **Images — no renaming** (as agreed):
  - Alt text is `{name in page language} ({scientific name})` on species, country and taxonomy pages.
  - Every photo tile now shows “Photo: {artist} · {license}”. The artist links to the Commons/iNaturalist page and the license to its deed. Species pages already did this in the caption.
  - Checked the data: all 349 Commons photos have an artist, a license and a page link. The 9 public-domain ones have no license URL, which is correct. The 13 iNaturalist and 21 own photos have artist and license too.
- **Mobile (375px, Playwright):**
  - No horizontal scroll on country, species, taxonomy, index or home pages.
  - The ranking table fits without scrolling: the bar is hidden on phones.
  - Header buttons are now 44px tall, and chips, breadcrumbs and list links have enlarged hit areas.
  - The size-chart dots are no longer links (too small to tap; each species is linked in the photo grid).
  - Inline photo-credit links are small. They count as inline text links under WCAG, so I left them.
  - The explorer's own buttons on the homepage (Anatomy, Wander, ES: 36×32px) are part of the app UI and were not changed.
- **Lighthouse 12.4, mobile, local server:**

  | Page | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | `/countries/colombia/` (166 photos) | 95 | 100 | 96 | 100 |
  | `/countries/barbados/` | 99 | 100 | 96 | 100 |
  | `/countries/` | 99 | 100 | 96 | 100 |
  | `/species/bee-hummingbird/` | 100 | 100 | 96 | 100 |

  Best practices loses points only to console errors from the sandbox blocking Google Fonts, Commons images and Cloudflare. The text-compression and cache warnings come from Python's local test server; GitHub Pages compresses and caches. Worth re-running on the live site.

## Task 7 — Validation

- Link checker (every `href`/`src` on 998 pages, including `#fragments`): **38,129 internal links, 0 broken**.
- No offline schema.org validator was available. Please test these in Google's Rich Results Test (https://search.google.com/test/rich-results):
  - https://hummingbirds.world/
  - https://hummingbirds.world/countries/
  - https://hummingbirds.world/countries/barbados/
  - https://hummingbirds.world/es/paises/mexico/
  - https://hummingbirds.world/species/bee-hummingbird/
  - https://hummingbirds.world/es/especies/colibri-gigante/
  - https://hummingbirds.world/taxonomy/mellisugini/
  - https://hummingbirds.world/es/taxonomia/eriocnemis/

## Before / after samples

#### `/countries/barbados/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds of Barbados: all 3 species · Hummingbirds World | Hummingbirds of Barbados: all 3 species, with photos |
| Description | All 3 hummingbird species of Barbados, with photos, sizes and Red List status. | 3 hummingbird species are found in Barbados, including the Green-throated Carib and the Antillean Crested Hummingbird. See photos and scientific names. |
| Intro (1st sentence) | 3 of the world's 363 hummingbird species live in or visit Barbados. | 3 of the world's 363 hummingbird species live in or visit Barbados, among them the Green-throated Carib and the Antillean Crested Hummingbird. |

#### `/countries/antigua-and-barbuda/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds of Antigua and Barbuda: all 3 species | Hummingbirds of Antigua and Barbuda: all 3 species |
| Description | All 3 hummingbird species of Antigua and Barbuda, with photos, sizes and Red List status. | 3 hummingbird species are found in Antigua and Barbuda, including the Antillean Crested Hummingbird. See photos and scientific names. |
| Intro (1st sentence) | 3 of the world's 363 hummingbird species live in or visit Antigua and Barbuda. | 3 of the world's 363 hummingbird species live in or visit Antigua and Barbuda, among them the Antillean Crested Hummingbird and the Green-throated Carib. |

#### `/countries/united-states/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds of the United States: all 25 species | Hummingbirds of the United States: all 25 species |
| Description | All 25 hummingbird species of the United States, with photos, sizes and Red List status. | 25 hummingbird species are found in the United States, including Anna's Hummingbird and the Ruby-throated Hummingbird. See photos and scientific names. |
| Intro (1st sentence) | 25 of the world's 363 hummingbird species live in or visit the United States. | 25 of the world's 363 hummingbird species live in or visit the United States, among them Anna's Hummingbird and the Ruby-throated Hummingbird. |

#### `/countries/colombia/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds of Colombia: all 166 species | Hummingbirds of Colombia: all 166 species, with photos |
| Description | All 166 hummingbird species of Colombia, including 18 found nowhere else, with photos, sizes and Red List status. | 166 hummingbird species are found in Colombia, including the Indigo-capped Hummingbird. See photos, scientific names and the 18 endemics. |
| Intro (1st sentence) | 166 of the world's 363 hummingbird species live in or visit Colombia, and 18 of them are found nowhere else on Earth. | 166 of the world's 363 hummingbird species live in or visit Colombia, among them the Indigo-capped Hummingbird and the White-tailed Starfrontlet. |

#### `/countries/costa-rica/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds of Costa Rica: all 52 species | Hummingbirds of Costa Rica: all 52 species, with photos |
| Description | All 52 hummingbird species of Costa Rica, including 2 found nowhere else, with photos, sizes and Red List status. | 52 hummingbird species are found in Costa Rica, including the Coppery-headed Emerald. See photos, scientific names and the 2 endemics. |
| Intro (1st sentence) | 52 of the world's 363 hummingbird species live in or visit Costa Rica, and 2 of them are found nowhere else on Earth. | 52 of the world's 363 hummingbird species live in or visit Costa Rica, among them the Coppery-headed Emerald and the Mangrove Hummingbird. |

#### `/countries/`

| | Before | After |
|---|---|---|
| Title | Which country has the most hummingbird species? | Which country has the most hummingbird species? |
| Description | Colombia has the most hummingbird species (166), then Ecuador (133) and Peru (130). All 55 countries and territories, ranked. | Colombia has the most hummingbird species (166), followed by Ecuador (133) and Peru (130). All 55 countries and territories with hummingbirds, ranked. |
| Intro (1st sentence) | The 363 hummingbird species live in 55 countries and territories, all of them in the Americas. | Colombia has the most hummingbird species (166), followed by Ecuador (133) and Peru (130). |

#### `/es/paises/mexico/`

| | Before | After |
|---|---|---|
| Title | Colibríes de México: las 59 especies · Hummingbirds World | Colibríes de México: las 59 especies con fotos |
| Description | Las 59 especies de colibrí de México, entre ellas 14 que no viven en ningún otro lugar, con fotos, tamaños y estado en la Lista Roja. | En México hay 59 especies de colibríes, como el Colibrí Opaco y el Colibrí Tijereta Mexicano. Fotos, nombres científicos y las 14 especies endémicas. |
| Intro (1st sentence) | 59 de las 363 especies de colibrí del mundo viven en México o lo visitan, y 14 de ellas no viven en ningún otro lugar del planeta. | 59 de las 363 especies de colibrí del mundo viven en México o lo visitan, entre ellas el Colibrí Opaco y el Colibrí Tijereta Mexicano. |

#### `/es/paises/barbados/`

| | Before | After |
|---|---|---|
| Title | Colibríes de Barbados: las 3 especies · Hummingbirds World | Colibríes de Barbados: las 3 especies con fotos |
| Description | Las 3 especies de colibrí de Barbados, con fotos, tamaños y estado en la Lista Roja. | En Barbados hay 3 especies de colibríes, como el Colibrí Caribeño Gorjiverde y el Colibrí Crestado. Fotos y nombres científicos. |
| Intro (1st sentence) | 3 de las 363 especies de colibrí del mundo viven en Barbados o lo visitan. | 3 de las 363 especies de colibrí del mundo viven en Barbados o lo visitan, entre ellas el Colibrí Caribeño Gorjiverde y el Colibrí Crestado. |

#### `/es/paises/colombia/`

| | Before | After |
|---|---|---|
| Title | Colibríes de Colombia: las 166 especies · Hummingbirds World | Colibríes de Colombia: las 166 especies con fotos |
| Description | Las 166 especies de colibrí de Colombia, entre ellas 18 que no viven en ningún otro lugar, con fotos, tamaños y estado en la Lista Roja. | En Colombia hay 166 especies de colibríes, como la Amazilia Capiazul y el Inca Coliblanco. Fotos, nombres científicos y las 18 especies endémicas. |
| Intro (1st sentence) | 166 de las 363 especies de colibrí del mundo viven en Colombia o lo visitan, y 18 de ellas no viven en ningún otro lugar del planeta. | 166 de las 363 especies de colibrí del mundo viven en Colombia o lo visitan, entre ellas la Amazilia Capiazul y el Inca Coliblanco. |

#### `/es/paises/venezuela/`

| | Before | After |
|---|---|---|
| Title | Colibríes de Venezuela: las 104 especies | Colibríes de Venezuela: las 104 especies con fotos |
| Description | Las 104 especies de colibrí de Venezuela, entre ellas 6 que no viven en ningún otro lugar, con fotos, tamaños y estado en la Lista Roja. | En Venezuela hay 104 especies de colibríes, como la Esmeralda Coliverde y el Colibrí de Mérida. Fotos, nombres científicos y las 6 especies endémicas. |
| Intro (1st sentence) | 104 de las 363 especies de colibrí del mundo viven en Venezuela o lo visitan, y 6 de ellas no viven en ningún otro lugar del planeta. | 104 de las 363 especies de colibrí del mundo viven en Venezuela o lo visitan, entre ellas la Esmeralda Coliverde y el Colibrí de Mérida. |

#### `/es/paises/republica-dominicana/`

| | Before | After |
|---|---|---|
| Title | Colibríes de la República Dominicana: las 4 especies | Colibríes de la República Dominicana: las 4 especies |
| Description | Las 4 especies de colibrí de la República Dominicana, con fotos, tamaños y estado en la Lista Roja. | En la República Dominicana hay 4 especies de colibríes, como el Mango Dominicano y el Colibrí Zumbadorcito. Fotos y nombres científicos. |
| Intro (1st sentence) | 4 de las 363 especies de colibrí del mundo viven en la República Dominicana o lo visitan. | 4 de las 363 especies de colibrí del mundo viven en la República Dominicana o lo visitan, entre ellas el Mango Dominicano y el Colibrí Zumbadorcito. |

#### `/es/paises/`

| | Before | After |
|---|---|---|
| Title | ¿Qué país tiene más especies de colibrí? | ¿Qué país tiene más especies de colibríes? |
| Description | Colombia tiene más especies de colibrí (166), seguida de Ecuador (133) y Perú (130). Los 55 países y territorios, por número de especies. | Colombia es el país con más especies de colibríes (166), seguido de Ecuador (133) y Perú (130). Los 55 países, por número de especies. |
| Intro (1st sentence) | Las 363 especies de colibrí viven en 55 países y territorios, todos en América. | Colombia es el país con más especies de colibríes (166), seguido de Ecuador (133) y Perú (130). |

#### `/species/bee-hummingbird/`

| | Before | After |
|---|---|---|
| Title | Bee Hummingbird (Mellisuga helenae): size, range & photo | Bee Hummingbird (Mellisuga helenae) – Range & Facts |
| Description | Bee Hummingbird (Mellisuga helenae): about 2.2 g, bill 12.2 mm. Found only in Cuba. Red List: Near threatened. Photo and facts. | Bee Hummingbird (Mellisuga helenae): about 2.2 g, bill 12.2 mm. Found only in Cuba. Red List: Near threatened. Photo and facts. |
| Intro (1st sentence) | The Bee Hummingbird (Mellisuga helenae) is a hummingbird in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). | The Bee Hummingbird (Mellisuga helenae) is a hummingbird of the genus Mellisuga, in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). |

#### `/species/giant-hummingbird/`

| | Before | After |
|---|---|---|
| Title | Giant Hummingbird (Patagona gigas): size, range & photo | Giant Hummingbird (Patagona gigas) – Range & Facts |
| Description | Giant Hummingbird (Patagona gigas): about 20.2 g, bill 45.2 mm. Lives in 6 countries, including Chile and Peru. Red List: Least concern. Photo and facts. | Giant Hummingbird (Patagona gigas): about 20.2 g, bill 45.2 mm. Lives in 6 countries, including Chile and Peru. Red List: Least concern. Photo and facts. |
| Intro (1st sentence) | The Giant Hummingbird (Patagona gigas) is a hummingbird in the subfamily Patagoninae (Patagona). | The Giant Hummingbird (Patagona gigas) is a hummingbird of the genus Patagona, in the subfamily Patagoninae (Patagona). |

#### `/species/rufous-hummingbird/`

| | Before | After |
|---|---|---|
| Title | Rufous Hummingbird (Selasphorus rufus): size, range & photo | Rufous Hummingbird (Selasphorus rufus) – Range & Facts |
| Description | Rufous Hummingbird (Selasphorus rufus): about 3.5 g, bill 20.4 mm. Lives in the United States, Canada and Mexico. Red List: Near threatened. | Rufous Hummingbird (Selasphorus rufus): about 3.5 g, bill 20.4 mm. Lives in the United States, Canada and Mexico. Red List: Near threatened. |
| Intro (1st sentence) | The Rufous Hummingbird (Selasphorus rufus) is a hummingbird in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). | The Rufous Hummingbird (Selasphorus rufus) is a hummingbird of the genus Selasphorus, in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). |

#### `/species/ruby-throated-hummingbird/`

| | Before | After |
|---|---|---|
| Title | Ruby-throated Hummingbird (Archilochus colubris) | Ruby-throated Hummingbird (Archilochus colubris) |
| Description | Ruby-throated Hummingbird (Archilochus colubris): about 3.1 g, bill 20.7 mm. Lives in 12 countries. Red List: Least concern. Photo and facts. | Ruby-throated Hummingbird (Archilochus colubris): about 3.1 g, bill 20.7 mm. Lives in 12 countries. Red List: Least concern. Photo and facts. |
| Intro (1st sentence) | The Ruby-throated Hummingbird (Archilochus colubris) is a hummingbird in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). | The Ruby-throated Hummingbird (Archilochus colubris) is a hummingbird of the genus Archilochus, in the subfamily Trochilinae (mountain gems, bees and emeralds), tribe Mellisugini (bees). |

#### `/es/especies/colibri-garganta-rubi/`

| | Before | After |
|---|---|---|
| Title | Colibrí Garganta Rubí (Archilochus colubris) | Colibrí Garganta Rubí (Archilochus colubris) |
| Description | Colibrí Garganta Rubí (Archilochus colubris): unos 3.1 g, pico de 20.7 mm. Vive en 12 países. Lista Roja: Preocupación menor. Foto y datos. | Colibrí Garganta Rubí (Archilochus colubris): unos 3.1 g, pico de 20.7 mm. Vive en 12 países. Lista Roja: Preocupación menor. Foto y datos. |
| Intro (1st sentence) | El Colibrí Garganta Rubí (Archilochus colubris) es un colibrí de la subfamilia Trochilinae (mountain gems, abejas y esmeraldas), tribu Mellisugini (abejas). | El Colibrí Garganta Rubí (Archilochus colubris) es un colibrí del género Archilochus, de la subfamilia Trochilinae (mountain gems, abejas y esmeraldas), tribu Mellisugini (abejas). |

#### `/es/especies/colibri-gigante/`

| | Before | After |
|---|---|---|
| Title | Colibrí Gigante (Patagona gigas): tamaño, área y foto | Colibrí Gigante (Patagona gigas) – distribución y datos |
| Description | Colibrí Gigante (Patagona gigas): unos 20.2 g, pico de 45.2 mm. Vive en 6 países, entre ellos Chile y Perú. Lista Roja: Preocupación menor. Foto y datos. | Colibrí Gigante (Patagona gigas): unos 20.2 g, pico de 45.2 mm. Vive en 6 países, entre ellos Chile y Perú. Lista Roja: Preocupación menor. Foto y datos. |
| Intro (1st sentence) | El Colibrí Gigante (Patagona gigas) es un colibrí de la subfamilia Patagoninae (Patagona). | El Colibrí Gigante (Patagona gigas) es un colibrí del género Patagona, de la subfamilia Patagoninae (Patagona). |

#### `/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds World: all 363 species, photos & map | Hummingbirds of the World – Every Species, by Country |
| Description | Explore every hummingbird species on one screen: family tree, world map, sizes and conservation status, with a photo of each and a 3D anatomy page. | All 363 hummingbird species in one explorer: family tree, world map, sizes and Red List status. Browse every species by country, with photos. |

#### `/es/`

| | Before | After |
|---|---|---|
| Title | Hummingbirds World: las 363 especies, fotos y mapa | Colibríes del mundo: todas las especies, por país |
| Description | Explora todas las especies de colibrí en una sola pantalla: árbol familiar, mapa, tamaños y estado de conservación, con foto de cada una y anatomía en 3D. | Las 363 especies de colibríes en un explorador: árbol familiar, mapa, tamaños y Lista Roja. Explora cada especie por país, con fotos. |

## Data gaps and decisions for Lia

- **Missing data** (pages leave these out; nothing was filled in):
  - Brace's Emerald (extinct) has no weight, bill, habitat or movement.
  - 31 species have no population trend (“Unknown”).
  - 2 have no Red List category: Coppery Thorntail (DD) and Blue-vented Hummingbird (NE).
  - 9 have no free photo and show a Macaulay Library embed: Merida Sunangel, Peacock Coquette, Venezuelan Sylph, Olivaceous Thornbill, Gorgeted Puffleg, Colorful Puffleg, Beautiful Hummingbird, Chiribiquete Emerald and Buff-breasted Sabrewing. These show “No free photo yet” in the tiles.
  - Turquoise-throated Puffleg and Brace's Emerald have only rare or uncertain country records, so their intro has no “lives in N countries” sentence.
- **Western Emerald:** its English and Spanish pages have the same title, because eBird Mexico uses the English name on purpose. Fine for search engines (different `lang` and hreflang).
- **“Notable” species** in country descriptions and intros are picked by eBird records (endemics first). If you'd rather name hand-picked species for some countries, that would need a small table in the script.
- **Long species names:** about half of the species titles don't get the “– Range & Facts” suffix because it would pass 60 characters. I kept the scientific name over the suffix, since people search it.
- **Patagoninae:** a subfamily page for its single species (the Giant Hummingbird). It was kept because all subfamilies get a page.

## Manual steps for Lia, after deploy

1. **GitHub → Settings → Pages:** confirm **Enforce HTTPS** is on.
2. **Google Search Console:** Sitemaps → resubmit `https://hummingbirds.world/sitemap.xml`.
3. **Bing Webmaster Tools:** resubmit the sitemap. The IndexNow workflow will also send every changed page after the push.
4. **Request indexing** (URL Inspection → Request indexing) for `/countries/`, `/es/paises/`, `/`, `/es/`, and a few new taxonomy pages: `/taxonomy/mellisugini/`, `/taxonomy/lesbiini/`, `/es/taxonomia/mellisugini/`, `/es/taxonomia/lesbiini/`.
5. Run the Rich Results Test on the URLs above.
6. Re-run Lighthouse (mobile) on the live `/countries/colombia/` and `/species/bee-hummingbird/`.
7. Measure, as in the brief: 14 days before vs after, filtered to `/countries/` and `/es/paises/`. Also check **Search type → Image**.
