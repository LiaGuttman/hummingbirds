// Language. The Spanish site (es/index.html, built by scripts/build_spanish.py) sets <html lang="es">;
// everything else is English. Spanish is Mexican Spanish, matching the eBird Mexico (es_MX) bird names.
const ES = document.documentElement.lang === "es";
// An inline English/Spanish pair: tx("Family", "Familia").
const tx = (en, es) => (ES ? es : en);

// Spanish terms for the data. scripts/build_species_pages.py reads this same block (between the markers),
// so the explorer and the species pages always use the same words.
// Group (clade) names: Spanish has no official names for the McGuire et al. (2014) clades. Where eBird's
// Mexican Spanish names use a group word (Ermitaño, Mango, Coqueta, Brillante, Esmeralda, Topacio) it is used;
// Where Spanish has no such word (mountain gems) the English name is kept, as Lia asked: no literal translations.
// "abejas" for the bees: Lia found it in a Spanish hummingbird book (Oct 5).
// Countries: Spanish (Mexico) names from the Unicode CLDR, as browsers show them.
// IUCN categories: the IUCN's own Spanish category names.
/* ES_DATA_START */
const ES_DATA = {
  clade: { "Florisuginae": "topacios", "Phaethornithinae": "ermitaños", "Polytminae": "mangos",
           "Lesbiinae": "coquetas y brillantes", "Patagoninae": "Patagona", "Trochilinae": "mountain gems, abejas y esmeraldas" },
  tribe: { "Lesbiini": "coquetas", "Heliantheini": "brillantes", "Lampornithini": "mountain gems", "Mellisugini": "abejas", "Trochilini": "esmeraldas" },
  iucn: { "LC": "Preocupación menor", "NT": "Casi amenazado", "VU": "Vulnerable", "EN": "En peligro", "CR": "En peligro crítico",
          "EX": "Extinto", "DD": "Datos insuficientes", "NE": "No evaluado" },
  moves: { "Sedentary": "Se queda en su zona todo el año", "Partial migrant": "Algunas poblaciones migran", "Migratory": "Migra" },
  habitat: { "Forest": "Bosque", "Shrubland": "Matorral", "Woodland": "Bosque abierto", "Gardens & towns": "Jardines y poblados", "Grassland": "Pastizal" },
  trend: { "Decreasing": "en disminución", "Stable": "estable", "Increasing": "en aumento" },
  presence: { "Resident": "residente", "Present": "presente", "Rare visitor": "visitante raro", "Breeding visitor": "visitante reproductivo",
              "Winter visitor": "visitante de invierno", "Passage migrant": "migrante de paso", "Regular visitor": "visitante regular",
              "Uncertain": "incierto", "Possibly extinct here": "posiblemente extinto aquí", "Extinct here": "extinto aquí" },
  country: { "AG": "Antigua y Barbuda", "AI": "Anguila", "AR": "Argentina", "AW": "Aruba", "BB": "Barbados", "BL": "San Bartolomé",
             "BM": "Bermudas", "BO": "Bolivia", "BQ": "Caribe neerlandés", "BR": "Brasil", "BS": "Bahamas", "BZ": "Belice", "CA": "Canadá",
             "CL": "Chile", "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "CW": "Curazao", "DM": "Dominica", "DO": "República Dominicana",
             "EC": "Ecuador", "FK": "Islas Malvinas", "GD": "Granada", "GF": "Guayana Francesa", "GP": "Guadalupe",
             "GS": "Islas Georgia del Sur y Sándwich del Sur", "GT": "Guatemala", "GY": "Guyana", "HN": "Honduras", "HT": "Haití",
             "JM": "Jamaica", "KN": "San Cristóbal y Nieves", "KY": "Islas Caimán", "LC": "Santa Lucía", "MF": "San Martín", "MQ": "Martinica",
             "MS": "Montserrat", "MX": "México", "NI": "Nicaragua", "PA": "Panamá", "PE": "Perú", "PM": "San Pedro y Miquelón",
             "PR": "Puerto Rico", "PY": "Paraguay", "SR": "Surinam", "SV": "El Salvador", "SX": "Sint Maarten", "TC": "Islas Turcas y Caicos",
             "TT": "Trinidad y Tobago", "US": "Estados Unidos", "UY": "Uruguay", "VC": "San Vicente y las Granadinas", "VE": "Venezuela",
             "VG": "Islas Vírgenes Británicas", "VI": "Islas Vírgenes de EE. UU." },
  // Group notes, translated from the English notes in traits.js that Lia approved (genus notes: Oct 3 2026).
  notes: {
    subfamily: {
      "Florisuginae": "La rama más antigua en separarse de todos los demás colibríes vivos. Dos géneros: los topacios (Topaza) y Florisuga. El nombre viene del género Florisuga, que en latín significa \"chupaflores\" (flos, flor, y sugere, chupar).",
      "Phaethornithinae": "Los ermitaños son en su mayoría de colores apagados, verdes, cafés y rufos, en lugar de brillantes. Muchos tienen el pico largo y curvo hacia abajo, y las plumas centrales de la cola largas. La mayoría vive en el sotobosque sombreado. En lugar de defender un grupo de flores, recorren una ruta fija entre flores dispersas por el bosque. Los machos se reúnen en grupos llamados leks, donde cada uno canta para atraer a las hembras. El nombre viene del género Phaethornis, que en griego significa \"ave del sol\" (Faetón, el resplandeciente, y ornis, ave).",
      "Polytminae": "Un grupo variado que incluye a los mangos, los orejas violetas (Colibri), las hadas (Heliothryx), los picolanzas (Doryfera) y los colibríes caribeños (Eulampis). Un rasgo común son unas diminutas sierras en el borde cortante del pico; el colibrí piquidentado es el caso extremo. El nombre viene del género Polytmus, de una palabra griega que significa \"muy valioso\".",
      "Lesbiinae": "Formada por dos clados, las coquetas (tribu Lesbiini) y los brillantes (tribu Heliantheini). La mayoría de sus especies vive en los Andes. El nombre viene del género Lesbia, el nombre que el poeta romano Catulo dio a la mujer de sus poemas de amor.",
      "Patagoninae": "Un solo género, Patagona: los colibríes gigantes, los más grandes de todos los colibríes. En 2024, científicos descubrieron que en realidad son dos especies: una del sur, que migra, y una del norte, que se queda en los Andes todo el año. La lista eBird/Clements que sigue este sitio todavía los cuenta como una sola. El nombre significa \"de la Patagonia\", la región del extremo sur de Sudamérica.",
      "Trochilinae": "Formada por tres clados: los que en inglés se llaman mountain gems, las abejas y las esmeraldas. Todas las especies de colibrí que se reproducen con regularidad en Estados Unidos o Canadá pertenecen a esta subfamilia. El nombre viene del género Trochilus, de trochilos, un ave pequeña de los textos griegos antiguos que, se decía, tomaba comida de los dientes de los cocodrilos. Toda la familia, Trochilidae, también lleva su nombre."
    },
    tribe: {
      "Lesbiini": "Los machos de muchas coquetas lucen adornos vistosos: crestas, penachos, barbas, o colas muy largas o finas como alambre. Incluye a las coquetas, los rabuditos (Discosura), los silfos (Aglaiocercus), los colilargos (Lesbia), los piquicortos (Ramphomicron y Chalcostigma), las metaluras (Metallura) y Oreotrochilus. Como su subfamilia, la tribu lleva el nombre del género Lesbia, el nombre que el poeta romano Catulo dio a la mujer de sus poemas de amor.",
      "Heliantheini": "En su mayoría aves medianas a grandes de los bosques andinos. Incluye a los incas (Coeligena), Boissonneaua, los calzaditos (Eriocnemis y Haplophaedia), Aglaeactis, los brillantes (Heliodoxa) y el colibrí picoespada. El nombre viene de Helianthea, un antiguo nombre de género que significa \"girasol\" (en griego helios, sol, y anthos, flor).",
      "Lampornithini": "Colibríes bastante grandes, sobre todo de los bosques de montaña de México y Centroamérica. El nombre viene del género Lampornis, que en griego significa \"ave antorcha\" o \"ave brillante\" (lampas, antorcha, y ornis, ave).",
      "Mellisugini": "En su mayoría aves muy pequeñas. En muchas especies, los machos hacen sonidos con las plumas de la cola durante sus picadas de cortejo. Incluye al colibrí zunzuncito. El nombre viene del género Mellisuga, que en latín significa \"chupamiel\" (mel, miel, y sugere, chupar).",
      "Trochilini": "La tribu más grande. Aves en su mayoría verdes, muchas con azul o violeta brillante, que viven en tierras bajas y piedemontes. Como su subfamilia, la tribu lleva el nombre del género Trochilus, de trochilos, un ave pequeña de los textos griegos antiguos."
    },
    genus: {
      "Topaza": "Los machos tienen dos plumas centrales de la cola espectaculares, muy largas, que se cruzan entre sí.",
      "Eutoxeres": "El pico se curva fuertemente hacia abajo, a la medida de las flores curvas de plantas como las Heliconia.",
      "Ramphodon": "El pico tiene diminutas sierras a lo largo de sus bordes.",
      "Phaethornis": "Picos largos y curvos, y plumas centrales de la cola largas, a menudo con la punta blanca. Los machos se reúnen en leks para cantar.",
      "Doryfera": "Un pico largo, recto y muy delgado.",
      "Augastes": "Los machos tienen una «visera» brillante sobre la cara. Las dos especies viven solo en las tierras altas del este de Brasil.",
      "Colibri": "Un parche de plumas azul violeta detrás del ojo (la «oreja») que pueden desplegar en sus exhibiciones.",
      "Heliactin": "Los machos tienen penachos de colores que sobresalen como cuernos.",
      "Androdon": "Diminutas sierras, como dientes, cerca de la punta del pico.",
      "Heliothryx": "Partes inferiores blancas y una cola larga.",
      "Eulampis": "Los colibríes caribeños viven en las islas de las Antillas Menores y tienen el pico curvo hacia abajo.",
      "Heliangelus": "La mayoría de los machos tiene una mancha brillante en la garganta (gorguera).",
      "Sephanoides": "Los machos tienen una corona color fuego. Una especie vive solo en las islas Juan Fernández, frente a Chile.",
      "Discosura": "Los machos tienen plumas de la cola delgadas y puntiagudas.",
      "Lophornis": "Aves diminutas. Los machos tienen crestas y abanicos de plumas moteadas o con destellos en el cuello.",
      "Aglaiocercus": "Los machos tienen colas muy largas e iridiscentes.",
      "Oreotrochilus": "Viven en lo alto de los Andes, hasta el límite de las nieves, y pueden entrar en torpor en las noches frías.",
      "Opisthoprora": "La punta del pico se curva un poco hacia arriba. A veces toma el néctar perforando la base de la flor en lugar de entrar por el frente.",
      "Lesbia": "Colas larguísimas y muy ahorquilladas.",
      "Ramphomicron": "Picos muy cortos.",
      "Chalcostigma": "Picos cortos.",
      "Oxypogon": "Los machos tienen una magnífica cresta puntiaguda y una barba larga. Viven en los pastizales del páramo alto de Colombia y Venezuela.",
      "Metallura": "Colas con brillo de color metálico.",
      "Haplophaedia": "«Pompones» esponjosos de plumas en las patas.",
      "Eriocnemis": "«Pompones» esponjosos de plumas en las patas, a menudo blancos.",
      "Loddigesia": "Las dos plumas exteriores de la cola del macho son alambres desnudos que se cruzan y terminan en grandes discos asombrosos (raquetas). Solo vive en el norte de Perú.",
      "Aglaeactis": "Los machos tienen una mancha de color brillante en la espalda; en las hembras es más apagada o no existe.",
      "Coeligena": "Picos largos y rectos.",
      "Ensifera": "El pico es más largo que el resto del cuerpo: es la única ave en la que pasa esto.",
      "Boissonneaua": "Suelen mantener las alas levantadas un momento después de posarse.",
      "Ocreatus": "Las plumas exteriores de la cola de los machos terminan en raquetas, y las patas tienen plumas esponjosas («botas»).",
      "Patagona": "El colibrí más grande, de unos 20 g.",
      "Heliomaster": "Picos muy largos y rectos.",
      "Lampornis": "Viven en bosques de montaña desde el suroeste de Estados Unidos hasta Panamá.",
      "Chaetocercus": "Están entre las aves más pequeñas del mundo.",
      "Selasphorus": "Incluye a algunos de los colibríes que migran más lejos, como el Zumbador Canelo.",
      "Archilochus": "Dos especies, el Colibrí Garganta Rubí y el Colibrí Barba Negra, y las dos migran. Algunos colibríes garganta rubí cruzan el Golfo de México sin parar, unas 20 horas sobre el mar abierto.",
      "Calypte": "Los machos tienen una corona brillante, y las plumas brillantes de su garganta se alargan en puntas a los lados.",
      "Mellisuga": "Incluye al Colibrí Zunzuncito de Cuba, el ave más pequeña del mundo: un macho mide unos 5.5 cm y pesa alrededor de 2 g. (Con los pesos que usa este sitio, el Colibrí Cora resulta un poco más ligero.)",
      "Doricha": "Los machos tienen la cola muy ahorquillada.",
      "Thaumastura": "Los machos tienen la cola muy ahorquillada.",
      "Campylopterus": "Los machos tienen el raquis de las plumas exteriores del ala engrosado y doblado.",
      "Pampa": "Los machos tienen el raquis de las plumas exteriores del ala engrosado y doblado.",
      "Trochilus": "Los machos tienen largas cintas en la cola. Solo vive en Jamaica.",
      "Orthorhyncus": "Los machos tienen una cresta puntiaguda."
    }
  }
};
/* ES_DATA_END */

// A species' name in the page's language, and the other one (shown under it on the card).
const nameOf = (s) => (ES ? s.es || s.common : s.common);
const otherName = (s) => (ES ? s.common : s.es);
// Data values in the page's language.
const habitatName = (h) => (ES ? ES_DATA.habitat[h] || h : h);
const trendName = (t) => (ES ? ES_DATA.trend[t] || t : t.toLowerCase());
const presenceName = (st) => (ES ? st.split(", ").map((p) => ES_DATA.presence[p] || p).join(", ") : st.toLowerCase());

// "el Colibrí Picoespada", "la Coqueta Adornada": the article follows the group word of the eBird Spanish name.
const FEMININE = new Set(["Coqueta", "Esmeralda", "Metalura", "Amazilia", "Ninfa"]);
const theEs = (s) => `${FEMININE.has(s.es.split(" ")[0]) ? "la" : "el"} ${s.es}`;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
