#!/bin/sh
# Rebuild everything generated, in order: public data (only where the private data folder exists next to this repo),
# the Spanish explorer page, species pages, country pages (both languages) and sitemap.xml. Needs Python 3.12+ and Node.
cd "$(dirname "$0")/.." || exit 1
if [ -f ../data/species.json ]; then python3 scripts/build_public_data.py || exit 1; fi
python3 scripts/build_spanish.py && python3 scripts/build_species_pages.py && python3 scripts/build_country_pages.py
