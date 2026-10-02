// What members of a group have in common, in plain words.
// DRAFT: written by Claude from general ornithological knowledge, not checked against a source yet.
// Every note needs checking (e.g. HBW Alive / Birds of the World) before a public release.
// Groups without a note still get the facts the app computes from species.json.

const NOTES = {
  subfamily: {
    Florisuginae: "The earliest branch to split from all other living hummingbirds. Two genera: the topazes (Topaza) and the jacobins (Florisuga).",
    Phaethornithinae: "Hermits are mostly dull green, brown and rufous rather than glittering. Many have long, down-curved bills and long central tail feathers. Most live in the shady forest understory.",
    Polytminae: "A varied group that includes the mangoes, violetears, fairies, lancebills and caribs.",
    Lesbiinae: "Made up of two clades, the coquettes (tribe Lesbiini) and the brilliants (tribe Heliantheini). Most of its species live in the Andes.",
    Patagoninae: "A single genus with one species in eBird/Clements: the Giant Hummingbird, the largest hummingbird.",
    Trochilinae: "Made up of three clades: the mountain gems, the bees and the emeralds. Every hummingbird that regularly breeds in the United States and Canada belongs here."
  },
  tribe: {
    Lesbiini: "Males of many coquettes carry showy ornaments: crests, tufts, beards, or very long or wire-thin tails. Includes the coquettes, thorntails, sylphs, trainbearers, thornbills, metaltails and hillstars.",
    Heliantheini: "Mostly medium to large birds of Andean forests. Includes the incas, starfrontlets, coronets, pufflegs, sunbeams, brilliants and the Sword-billed Hummingbird.",
    Lampornithini: "Fairly large hummingbirds, mostly of mountain forests in Mexico and Central America.",
    Mellisugini: "Mostly very small birds. In many species the males make sounds with their tail feathers during display dives. Includes the woodstars and the Bee Hummingbird.",
    Trochilini: "The largest tribe. Mostly green birds, many with glittering blue or violet, living in lowlands and foothills."
  },
  genus: {
    Topaza: "Males have two very long central tail feathers that cross over each other.",
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
    Opisthoprora: "The tip of the bill turns slightly upward.",
    Lesbia: "Extremely long, deeply forked tails.",
    Ramphomicron: "Very short bills.",
    Chalcostigma: "Very short bills.",
    Oxypogon: "Males have a crest and a beard. They live in high páramo grassland in Colombia and Venezuela.",
    Metallura: "Tails glossed with metallic color.",
    Haplophaedia: "Fluffy 'puffs' of feathers on the legs.",
    Eriocnemis: "Fluffy 'puffs' of feathers on the legs, often white.",
    Loddigesia: "The male's two outer tail feathers end in large discs (rackets). Found only in northern Peru.",
    Aglaeactis: "A patch of glittering color on the back.",
    Coeligena: "Long, straight bills.",
    Ensifera: "The bill is longer than the rest of the body, the only bird for which this is true.",
    Boissonneaua: "Often hold their wings raised for a moment after landing.",
    Ocreatus: "Males' outer tail feathers end in rackets, and the legs have puffy feathers ('boots').",
    Patagona: "The largest hummingbird, about 20 g.",
    Heliomaster: "Very long, straight bills.",
    Lampornis: "Live in highland forests from the southwestern United States to Panama.",
    Chaetocercus: "Among the smallest birds in the world.",
    Selasphorus: "Includes some of the longest-migrating hummingbirds, such as the Rufous Hummingbird.",
    Archilochus: "The Ruby-throated Hummingbird crosses the Gulf of Mexico on migration.",
    Calypte: "Males have a glittering crown as well as a glittering throat.",
    Mellisuga: "Includes the Bee Hummingbird of Cuba, the smallest bird in the world.",
    Doricha: "Deeply forked tails.",
    Thaumastura: "A deeply forked tail.",
    Campylopterus: "Males have thickened, bent shafts on their outer wing feathers (the 'sabres').",
    Pampa: "Males have thickened, bent shafts on their outer wing feathers (the 'sabres').",
    Trochilus: "Males have long tail streamers. Found only in Jamaica.",
    Orthorhyncus: "Males have a pointed crest."
  }
};
