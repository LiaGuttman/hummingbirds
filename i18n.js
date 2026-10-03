// Language. The Spanish site (es/index.html, built by scripts/build_spanish.py) sets <html lang="es">;
// everything else is English. Spanish is Mexican Spanish, matching the eBird Mexico (es_MX) bird names.
const ES = document.documentElement.lang === "es";
// An inline English/Spanish pair: tx("Family", "Familia").
const tx = (en, es) => (ES ? es : en);

// Spanish terms for the data. scripts/build_species_pages.py reads this same block (between the markers),
// so the explorer and the species pages always use the same words.
// Group (clade) names: Spanish has no official names for the McGuire et al. (2014) clades. Where eBird's
// Mexican Spanish names use a group word (Ermitaño, Mango, Coqueta, Brillante, Esmeralda, Topacio) it is used;
// "gemas de montaña" and "abejas" are literal translations and need Lia's review.
// Countries: Spanish (Mexico) names from the Unicode CLDR, as browsers show them.
// IUCN categories: the IUCN's own Spanish category names.
/* ES_DATA_START */
const ES_DATA = {
  clade: { "Florisuginae": "topacios", "Phaethornithinae": "ermitaños", "Polytminae": "mangos",
           "Lesbiinae": "coquetas y brillantes", "Patagoninae": "Patagona", "Trochilinae": "gemas de montaña, abejas y esmeraldas" },
  tribe: { "Lesbiini": "coquetas", "Heliantheini": "brillantes", "Lampornithini": "gemas de montaña", "Mellisugini": "abejas", "Trochilini": "esmeraldas" },
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
  // Subfamily and tribe notes, translated from the approved English notes in traits.js.
  // Genus notes are still drafts under review in English, so the Spanish site doesn't show them yet.
  notes: {
    subfamily: {
      "Florisuginae": "La rama más antigua en separarse de todos los demás colibríes vivos. Dos géneros: los topacios (Topaza) y Florisuga.",
      "Phaethornithinae": "Los ermitaños son en su mayoría de colores apagados, verdes, cafés y rufos, en lugar de brillantes. Muchos tienen el pico largo y curvo hacia abajo, y las plumas centrales de la cola largas. La mayoría vive en el sotobosque sombreado. En lugar de defender un grupo de flores, recorren una ruta fija entre flores dispersas por el bosque. Los machos se reúnen en grupos llamados leks, donde cada uno canta para atraer a las hembras.",
      "Polytminae": "Un grupo variado que incluye a los mangos, los orejas violetas (Colibri), las hadas (Heliothryx), los picolanzas (Doryfera) y los colibríes caribeños (Eulampis). Un rasgo común son unas diminutas sierras en el borde cortante del pico; el colibrí piquidentado es el caso extremo.",
      "Lesbiinae": "Formada por dos clados, las coquetas (tribu Lesbiini) y los brillantes (tribu Heliantheini). La mayoría de sus especies vive en los Andes.",
      "Patagoninae": "Un solo género, Patagona: los colibríes gigantes, los más grandes de todos los colibríes. En 2024, científicos descubrieron que en realidad son dos especies: una del sur, que migra, y una del norte, que se queda en los Andes todo el año. La lista eBird/Clements que sigue este sitio todavía los cuenta como una sola.",
      "Trochilinae": "Formada por tres clados: las gemas de montaña, las abejas y las esmeraldas. Todas las especies de colibrí que se reproducen con regularidad en Estados Unidos o Canadá pertenecen a esta subfamilia."
    },
    tribe: {
      "Lesbiini": "Los machos de muchas coquetas lucen adornos vistosos: crestas, penachos, barbas, o colas muy largas o finas como alambre. Incluye a las coquetas, los rabuditos (Discosura), los silfos (Aglaiocercus), los colilargos (Lesbia), los piquicortos (Ramphomicron y Chalcostigma), las metaluras (Metallura) y Oreotrochilus.",
      "Heliantheini": "En su mayoría aves medianas a grandes de los bosques andinos. Incluye a los incas (Coeligena), Boissonneaua, los calzaditos (Eriocnemis y Haplophaedia), Aglaeactis, los brillantes (Heliodoxa) y el colibrí picoespada.",
      "Lampornithini": "Colibríes bastante grandes, sobre todo de los bosques de montaña de México y Centroamérica.",
      "Mellisugini": "En su mayoría aves muy pequeñas. En muchas especies, los machos hacen sonidos con las plumas de la cola durante sus picadas de cortejo. Incluye al colibrí zunzuncito.",
      "Trochilini": "La tribu más grande. Aves en su mayoría verdes, muchas con azul o violeta brillante, que viven en tierras bajas y piedemontes."
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
