// What members of a group have in common, in plain words.
// Reviewed by Lia (Oct 2026): subfamily and tribe notes are approved or corrected with sources;
// the genus notes were drafted by Claude and approved by Lia on Oct 3 2026. Spanish versions are in i18n.js.
// Groups without a note still get the facts the app computes from species.json.

const NOTES = {
  subfamily: {
    Florisuginae: "The earliest branch to split from all other living hummingbirds. Two genera: the topazes (Topaza) and the jacobins (Florisuga). The name comes from the genus Florisuga, Latin for \"flower-sucker\" (flos, flower, and sugere, to suck).",
    Phaethornithinae: "Hermits are mostly dull green, brown and rufous rather than glittering. Many have long, down-curved bills and long central tail feathers. Most live in the shady forest understory. Instead of guarding a patch of flowers, they fly a regular route between flowers spread through the forest (trap-lining). Males gather in groups called leks, where each sings to attract females. The name comes from the genus Phaethornis, Greek for \"sun bird\" (Phaethon, the shining one, and ornis, bird).",
    Polytminae: "A varied group that includes the mangoes, violetears, fairies, lancebills and caribs. A common feature is tiny serrations on the cutting edge of the bill; the Tooth-billed Hummingbird is the extreme example. The name comes from the genus Polytmus, from a Greek word meaning \"very precious\".",
    Lesbiinae: "Made up of two clades, the coquettes (tribe Lesbiini) and the brilliants (tribe Heliantheini). Most of its species live in the Andes. The name comes from the genus Lesbia, the name the Roman poet Catullus gave to the woman in his love poems.",
    Patagoninae: "A single genus, Patagona: the giant hummingbirds, the largest of all hummingbirds. In 2024 scientists found it is really two species: the Southern Giant Hummingbird, which migrates, and the Northern Giant Hummingbird, which stays in the Andes all year. The eBird/Clements list this site follows still counts them as one. The name means \"of Patagonia\", the region at the southern tip of South America.",
    Trochilinae: "Made up of three clades: the mountain gems, the bees and the emeralds. Every hummingbird species that regularly breeds in the United States or Canada belongs to this subfamily. The name comes from the genus Trochilus, from trochilos, a small bird in ancient Greek writings that was said to pick food from crocodiles' teeth. The whole family, Trochilidae, is named after it too."
  },
  tribe: {
    Lesbiini: "Males of many coquettes carry showy ornaments: crests, tufts, beards, or very long or wire-thin tails. Includes the coquettes, thorntails, sylphs, trainbearers, thornbills, metaltails and hillstars. Like its subfamily, the tribe is named after the genus Lesbia, the name the Roman poet Catullus gave to the woman in his love poems.",
    Heliantheini: "Mostly medium to large birds of Andean forests. Includes the incas, starfrontlets, coronets, pufflegs, sunbeams, brilliants and the Sword-billed Hummingbird. The name comes from Helianthea, an old genus name meaning \"sunflower\" (Greek helios, sun, and anthos, flower).",
    Lampornithini: "Fairly large hummingbirds, mostly of mountain forests in Mexico and Central America. The name comes from the genus Lampornis, Greek for \"torch bird\" or \"shining bird\" (lampas, torch, and ornis, bird).",
    Mellisugini: "Mostly very small birds. In many species the males make sounds with their tail feathers during display dives. Includes the woodstars and the Bee Hummingbird. The name comes from the genus Mellisuga, Latin for \"honey-sucker\" (mel, honey, and sugere, to suck).",
    Trochilini: "The largest tribe. Mostly green birds, many with glittering blue or violet, living in lowlands and foothills. Like its subfamily, the tribe is named after the genus Trochilus, from trochilos, a small bird in ancient Greek writings."
  },
  genus: {
    Topaza: "Males have two spectacular, very long central tail feathers that cross over each other.",
    Eutoxeres: "The bill curves sharply downward, matching the curved flowers of plants such as Heliconia.",
    Ramphodon: "The bill has tiny saw-like serrations along its edges.",
    Phaethornis: "Long, curved bills and long central tail feathers, often white-tipped. Males gather in leks to sing.",
    Doryfera: "A long, straight, very thin bill.",
    Augastes: "Males have a glittering 'visor' over the face. Both species live only in the highlands of eastern Brazil.",
    Colibri: "A patch of violet-blue feathers behind the eye (the 'ear') that can be fanned out in display.",
    Heliactin: "Males have colorful tufts that stick out like horns.",
    Androdon: "Tiny tooth-like serrations near the tip of the bill.",
    Heliothryx: "White underparts and a long tail.",
    Eulampis: "Caribs live on the islands of the Lesser Antilles and have down-curved bills.",
    Heliangelus: "Most males have a glittering throat patch (gorget).",
    Sephanoides: "Males have a fiery crown. One species lives only on the Juan Fernández Islands off Chile.",
    Discosura: "Males have thin, spiky tail feathers.",
    Lophornis: "Tiny birds. Males have crests and fans of spotted or spangled feathers on the neck.",
    Aglaiocercus: "Males have very long, iridescent tails.",
    Oreotrochilus: "Live high in the Andes, up to the snow line, and can drop into torpor on cold nights.",
    Opisthoprora: "The tip of the bill turns slightly upward. It sometimes takes nectar by piercing the base of a flower instead of reaching in from the front.",
    Lesbia: "Extremely long, deeply forked tails.",
    Ramphomicron: "Very short bills.",
    Chalcostigma: "Short bills.",
    Oxypogon: "Males have a magnificent spiky crest and a long beard. They live in high páramo grassland in Colombia and Venezuela.",
    Metallura: "Tails glossed with metallic color.",
    Haplophaedia: "Fluffy 'puffs' of feathers on the legs.",
    Eriocnemis: "Fluffy 'puffs' of feathers on the legs, often white.",
    Loddigesia: "The male's two outer tail feathers are bare wires that cross each other and end in big, astonishing discs (rackets). Found only in northern Peru.",
    Aglaeactis: "Males have a patch of glittering color on the back; in females it is duller or missing.",
    Coeligena: "Long, straight bills.",
    Ensifera: "The bill is longer than the rest of the body, the only bird for which this is true.",
    Boissonneaua: "Often hold their wings raised for a moment after landing.",
    Ocreatus: "Males' outer tail feathers end in rackets, and the legs have puffy feathers ('boots').",
    Patagona: "The largest hummingbird, about 20 g.",
    Heliomaster: "Very long, straight bills.",
    Lampornis: "Live in highland forests from the southwestern United States to Panama.",
    Chaetocercus: "Among the smallest birds in the world.",
    Selasphorus: "Includes some of the longest-migrating hummingbirds, such as the Rufous Hummingbird.",
    Archilochus: "Two species, the Ruby-throated and the Black-chinned Hummingbird, and both migrate. Some Ruby-throats fly nonstop across the Gulf of Mexico, about 20 hours over open water.",
    Calypte: "Males have a glittering crown, and their glittering throat feathers stretch out into points at the sides.",
    Mellisuga: "Includes the Bee Hummingbird of Cuba, the smallest bird in the world: a male is about 5.5 cm long and weighs about 2 g. (In the weights this site uses, the Peruvian Sheartail comes out a little lighter.)",
    Doricha: "Males have deeply forked tails.",
    Thaumastura: "Males have a deeply forked tail.",
    Campylopterus: "Males have thickened, bent shafts on their outer wing feathers (the 'sabres').",
    Pampa: "Males have thickened, bent shafts on their outer wing feathers (the 'sabres').",
    Trochilus: "Males have long tail streamers. Found only in Jamaica.",
    Orthorhyncus: "Males have a pointed crest."
  }
};
