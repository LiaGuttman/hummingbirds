"""Write app/species.json: the public copy of data/species.json used by the website.

Keeps only the fields the app shows. Drops Lia's life-list fields (seen, seen_date, seen_loc)
and internal review fields (rules, review flags, BirdLife slugs).
Only Lia can run this: it reads the private data/species.json in the folder next to this repo.
Run from the website repo folder:  python3 scripts/build_public_data.py
"""
import json
from pathlib import Path

APP = Path(__file__).resolve().parent.parent  # the website repo
# The private source data (with Lia's sightings) lives next to the repo, never inside it.
ROOT = APP.parent
SPECIES_FIELDS = ["seq", "subfamily", "tribe", "genus", "sci", "authority", "common", "ioc_name", "es",
                  "code", "iucn", "endemic", "extinct", "mass", "bill", "habitat", "migration", "trend"]
DIST_FIELDS = ["c", "iso", "st", "n"]

# Corrections to values that are wrong in the source data (data/species.json stays untouched).
# Little Woodstar: the source gives 6.5 g; field guides give about 2.2-2.5 g for this tiny woodstar.
# Western Emerald (weseme1) keeps eBird Mexico's English fallback on purpose: other eBird Spanish lists call it
# "Esmeralda Occidental", but eBird Mexico already uses that name for the Golden-crowned Emerald (Cynanthus auriceps).
# Black-breasted Puffleg: the source gives 8.5 g, which is its length in cm (the same slip as the Little Woodstar);
# Birds of the World (Identification) gives 4.3–4.6 g, so the middle of that range is used.
FIXES = {"litwoo5": {"mass": 2.2}, "blbpuf3": {"mass": 4.5}}

# Red List status for species BirdLife's data doesn't match yet (recent splits), from the Conservation
# sections of Birds of the World, as quoted by Lia (Oct 3 2026). The note says how old or indirect the
# rating is; status_src links the source. Shown on the card and the species page in both languages.
BOW = "https://birdsoftheworld.org/bow/species/{}/cur/conservation"
STATUS_FIXES = {
    "rubrat1": {"iucn": "LC",
        "status_note": "Assessed in 2016, when it was still considered one species with the White-booted and Peruvian Racket-tails.",
        "status_note_es": "Evaluado en 2016, cuando todavía se consideraba una sola especie con el Colibrí de Raquetas Faldiblanco y el Colibrí de Raquetas Peruano."},
    "boorat2": {"iucn": "LC",
        "status_note": "Assessed in 2016, when it was still considered one species with the White-booted and Rufous-booted Racket-tails.",
        "status_note_es": "Evaluado en 2016, cuando todavía se consideraba una sola especie con el Colibrí de Raquetas Faldiblanco y el Colibrí de Raquetas Faldirrojo."},
    "lesvio1": {"iucn": "LC",
        "status_note": "Rated by BirdLife International in 2011.",
        "status_note_es": "Calificado por BirdLife International en 2011."},
    # Birds of the World says only "not globally threatened", without an IUCN category, so it stays Not evaluated.
    "buvhum1": {"status_note": "Not globally threatened, but no IUCN category is given.",
        "status_note_es": "No está amenazado a nivel mundial, pero no se indica una categoría de la UICN."},
}
for code, fix in STATUS_FIXES.items():
    FIXES.setdefault(code, {}).update(fix, status_src=BOW.format(code))

# Movement for species AVONET gets wrong, from the range map pages of All About Birds (Cornell Lab),
# allaboutbirds.org/guide/<Name>/maps-range, opened Oct 6 2026. Quoted summary line after each.
# Broad-tailed: "Medium-distance migrant", but the Birds of the World map (in Merlin) also shows a
# year-round range in Mexico, so some populations migrate rather than all.
# Not changed: Blue-throated Mountain-gem ("Short-distance migrant") covers only the US birds; to check.
MIGRATION_FIXES = {
    "rufhum": "Migratory",        # "Long-distance migrant."
    "brthum": "Partial migrant",  # "Medium-distance migrant." + year-round range in Mexico
    "allhum": "Partial migrant",  # "Resident to medium-distance migrant."
    "coshum": "Partial migrant",  # "Resident to short-distance migrant."
    "vichum": "Partial migrant",  # "Resident to medium-distance migrant."
    "bubhum": "Partial migrant",  # "Resident to short-distance migrant."
    "whehum": "Partial migrant",  # "Mostly nonmigratory, but northernmost populations are migratory"
}
for code, value in MIGRATION_FIXES.items():
    FIXES.setdefault(code, {})["migration"] = value

# Countries to leave out of a species' range. Xantus's in Canada: BirdLife lists it as a vagrant and eBird has
# 87 checklists, but they are all one female that stayed in British Columbia; Lia decided to drop it (Oct 11 2026).
DIST_DROP = {"xanhum": {"CA"}}

species = json.loads((ROOT / "data" / "species.json").read_text())
public = []
for s in species:
    row = {k: s.get(k) for k in SPECIES_FIELDS}
    row.update(FIXES.get(s["code"], {}))
    row["dist"] = [{k: d.get(k) for k in DIST_FIELDS} for d in s["dist"] if d["iso"] not in DIST_DROP.get(s["code"], ())]
    public.append(row)

out = APP / "species.json"
out.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")))
print(f"{len(public)} species → {out} ({out.stat().st_size // 1024} KB)")
