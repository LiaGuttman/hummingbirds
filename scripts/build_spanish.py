"""Write app/es/index.html: the explorer in Mexican Spanish, made from app/index.html.

The page is the English one with <html lang="es"> (which switches app.js, anatomy.js and comet.js to
Spanish, see app/i18n.js), a <base href="../"> so it shares every file with the English site, and its
fixed text translated below. Every English string must be found exactly once, so a change to
index.html that breaks the translation stops the build instead of leaving English behind.

The About & credits dialog is replaced as a whole by the Spanish version below. If the English one
changes, the build stops and asks for the Spanish to be updated (CREDITS_EN_HASH).

Run from the website repo folder (needs Python 3.12+ and Node) after any change to app/index.html:
    python3 scripts/build_spanish.py
"""
import hashlib, re, sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent  # the website repo (this folder's parent)
SITE = "https://hummingbirds.world"
CREDITS_EN_HASH = "da4a0eb237c3178c"

DESC = ("Explora todas las especies de colibrí en una sola pantalla: árbol familiar, mapa, tamaños y estado de "
        "conservación, con foto de cada una y anatomía en 3D.")

REPLACE = [
    ('<html lang="en">', '<html lang="es">'),
    ('<meta charset="utf-8">', '<meta charset="utf-8">\n<!-- Spanish copy of index.html (scripts/build_spanish.py). The base makes every file load from the site root. -->\n<base href="../">'),
    ('<title>Hummingbirds World: all 363 species, photos &amp; map</title>', '<title>Hummingbirds World: las 363 especies, fotos y mapa</title>'),
    ('<link rel="canonical" href="https://hummingbirds.world/">', '<link rel="canonical" href="https://hummingbirds.world/es/">'),
    ('"url": "https://hummingbirds.world/", "description": "An interactive explorer of all 363 hummingbird species: by family tree, on the world map, by size and by conservation status."',
     '"url": "https://hummingbirds.world/es/", "description": "Un explorador interactivo de las 363 especies de colibrí: por árbol familiar, en el mapa del mundo, por tamaño y por estado de conservación."'),
    ('"inLanguage": "en"', '"inLanguage": "es"'),
    ('<meta name="description" content="Explore every hummingbird species on one screen: family tree, world map, sizes and conservation status, with a photo of each and a 3D anatomy page.">',
     f'<meta name="description" content="{DESC}">'),
    ('<meta property="og:url" content="https://hummingbirds.world/">', '<meta property="og:url" content="https://hummingbirds.world/es/">\n<meta property="og:locale" content="es_MX">'),
    ('<meta property="og:description" content="Explore every hummingbird species on one screen: family tree, world map, sizes and conservation status, with a photo of each and a 3D anatomy page.">',
     f'<meta property="og:description" content="{DESC}">'),
    ('content="The Hummingbirds site: a flock of all 363 species in color, next to the title."',
     'content="El sitio Hummingbirds World: una parvada de las 363 especies en color, junto al título."'),
    ('aria-label="Every hummingbird species, shown as colored shapes"', 'aria-label="Todas las especies de colibrí, como figuras de colores"'),
    ('aria-label="Ways to arrange the collection"', 'aria-label="Formas de ordenar la colección"'),
    ('data-view="swarm">Collection</button>', 'data-view="swarm">Colección</button>'),
    ('data-view="family">Family tree</button>', 'data-view="family">Árbol familiar</button>'),
    ('data-view="world">World</button>', 'data-view="world">Mundo</button>'),
    ('data-view="size">Size</button>', 'data-view="size">Tamaño</button>'),
    ('data-view="status">Status</button>', 'data-view="status">Estado</button>'),
    ('id="searchBtn" aria-label="Search species, groups or places"', 'id="searchBtn" aria-label="Buscar especies, grupos o lugares"'),
    ('title="Search (/)"', 'title="Buscar (/)"'),
    ('placeholder="Search species, groups or places"', 'placeholder="Buscar especies, grupos o lugares"'),
    ('aria-label="Search species, groups or places" aria-controls="results"', 'aria-label="Buscar especies, grupos o lugares" aria-controls="results"'),
    ('title="A hummingbird\'s body, part by part"', 'title="El cuerpo de un colibrí, parte por parte"'),
    ('<span>Anatomy</span>', '<span>Anatomía</span>'),
    ('<span>Wander</span>', '<span>Pasear</span>'),
    ('<a class="wander lang" id="langBtn" href="es/" hreflang="es" lang="es" title="Ver en español">ES</a>',
     '<a class="wander lang" id="langBtn" href="./" hreflang="en" lang="en" title="View in English">EN</a>'),
    ('aria-label="Where you are"', 'aria-label="Dónde estás"'),
    ('<button class="credits-link" id="creditsBtn">About &amp; credits</button>', '<button class="credits-link" id="creditsBtn">Acerca del sitio</button>'),
    ('title="Share this view">', 'title="Compartir esta vista">'),
    ('<span>Share</span>', '<span>Compartir</span>'),
    ('<h2 id="anatomy-title">Hummingbird anatomy</h2>', '<h2 id="anatomy-title">Anatomía del colibrí</h2>'),
    ('<button class="close an-close" data-close aria-label="Close">', '<button class="close an-close" data-close aria-label="Cerrar">'),
    ('<p class="an-credit">3D model: ', '<p class="an-credit">Modelo 3D: '),
    ('>Swallow-tailed Hummingbird</a> by gelmi.com.br, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>',
     '>Swallow-tailed Hummingbird</a> de gelmi.com.br, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>'),
    ('<dialog class="lightbox" id="lightbox" aria-label="Photo">', '<dialog class="lightbox" id="lightbox" aria-label="Foto">'),
    ('<button class="lb-close" id="lbClose" aria-label="Close">', '<button class="lb-close" id="lbClose" aria-label="Cerrar">'),
    ('aria-label="Previous photo">‹</button>', 'aria-label="Foto anterior">‹</button>'),
    ('aria-label="Next photo">›</button>', 'aria-label="Foto siguiente">›</button>'),
    ('<div class="loading" id="loading">Gathering hummingbirds…</div>', '<div class="loading" id="loading">Reuniendo colibríes…</div>'),
]

CREDITS_ES = """<dialog class="credits" id="credits" aria-labelledby="credits-title">
  <button class="close" id="creditsClose" aria-label="Cerrar">×</button>
  <h2 id="credits-title">Acerca del sitio y créditos</h2>
  <p>Este explorador muestra las 363 especies de colibrí (familia Trochilidae) reconocidas en la taxonomía eBird/Clements. Cada figura es una especie; abre una para ver su foto y sus datos. Cada especie también tiene su propia página: consulta la <a href="es/especies/">lista de las 363 especies</a>, o explóralas <a href="es/paises/">por país</a>. Algunas para empezar: el <a href="es/especies/colibri-zunzuncito/">Colibrí Zunzuncito</a>, el ave más pequeña del mundo; el <a href="es/especies/colibri-gigante/">Colibrí Gigante</a>; el <a href="es/especies/colibri-picoespada/">Colibrí Picoespada</a>; y, de Norteamérica, el <a href="es/especies/colibri-garganta-rubi/">Colibrí Garganta Rubí</a>, el <a href="es/especies/colibri-cabeza-roja/">Colibrí Cabeza Roja</a> y el <a href="es/especies/zumbador-canelo/">Zumbador Canelo</a>.</p>
  <p>Esta versión en español es una traducción del sitio original en inglés.</p>

  <h3>Hecho por</h3>
  <p>Lia Guttman (<a href="https://ebird.org/profile/Mjc2NTcyMA" target="_blank" rel="noopener">perfil en eBird</a>). Las fotos con crédito a Lia Guttman son suyas y se comparten con licencia <a href="https://creativecommons.org/licenses/by/4.0/deed.es">CC BY 4.0</a>: puedes usarlas, citando a la autora.</p>

  <h3>Contacto</h3>
  <p>¿Encontraste un error o tienes una foto de una especie que te gustaría ver aquí? Escríbele a Lia a <a href="mailto:lia@hummingbirds.world">lia@hummingbirds.world</a>. Si mandas una foto, indica cómo quieres aparecer en el crédito: se muestra con tu nombre y conservas todos los derechos. Al enviarla, aceptas que se publique en este sitio. Manda solo fotos tomadas por ti y, si puedes, en tamaño completo.</p>

  <h3>Fuentes de datos</h3>
  <dl>
    <dt>Lista de especies y nombres</dt>
    <dd><a href="https://www.birds.cornell.edu/clementschecklist/">eBird/Clements Checklist of Birds of the World</a>, a través de la API de <a href="https://ebird.org">eBird</a> (Cornell Lab of Ornithology). Los nombres en inglés y en español (México) vienen de la misma fuente; <i>Chlorostilbon melanorhynchus</i> (Western Emerald) no tiene nombre propio en la lista de México, así que se muestra con su nombre en inglés, como en eBird. Los nombres del IOC, cuando son distintos, vienen de la <a href="https://www.worldbirdnames.org/">IOC World Bird List</a> v15 (Gill, Donsker y Rasmussen, eds.).</dd>
    <dt>Subfamilias y tribus</dt>
    <dd>Dickinson, E.C. y Remsen, J.V. Jr. (eds.) 2013. <i>The Howard and Moore Complete Checklist of the Birds of the World</i>, 4.ª ed., vol. 1. Aves Press.<br>
        McGuire, J.A. et al. 2014. <a href="https://doi.org/10.1016/j.cub.2014.03.016">Molecular phylogenetics and the diversification of hummingbirds</a>. <i>Current Biology</i> 24: 910–916. Los nombres informales de los clados siguen este artículo (en inglés: topazes, hermits, mangoes, coquettes, brilliants, Patagona, mountain gems, bees, emeralds); en español se usan las palabras de los nombres de eBird en español cuando existen (topacios, ermitaños, mangos, coquetas, brillantes, esmeraldas) y «abejas», como en la literatura en español sobre colibríes; si no, se deja el nombre en inglés.</dd>
    <dt>Países</dt>
    <dd>Listas por país de <a href="https://datazone.birdlife.org/">BirdLife International DataZone</a>, comparadas con los registros de eBird del <a href="https://www.gbif.org/dataset/4fa7b334-ce0d-4e88-aaae-2e0c138d049e">eBird Observation Dataset</a> (Cornell Lab of Ornithology, CC BY 4.0), consultado a través de la API de GBIF.org. Seis especies raras usan áreas de distribución de la literatura publicada.</dd>
    <dt>Peso, pico, hábitat y movimientos</dt>
    <dd>AVONET: Tobias, J.A. et al. 2022. <a href="https://doi.org/10.1111/ele.13898">AVONET: morphological, ecological and geographical data for all birds</a>. <i>Ecology Letters</i> 25: 581–597. Licencia <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Las especies separadas recientemente usan los valores de la especie de la que se separaron.</dd>
    <dt>Estado de conservación y tendencia</dt>
    <dd><a href="https://datazone.birdlife.org/">BirdLife International</a> (la autoridad de la Lista Roja de la UICN para las aves), y la <a href="https://www.iucnredlist.org/">Lista Roja de Especies Amenazadas de la UICN</a> a través de GBIF cuando una especie no coincide uno a uno con una especie de BirdLife. Las categorías usan los nombres oficiales en español de la UICN.</dd>
    <dt>Fotos</dt>
    <dd>De <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> y, cuando Commons no tiene ninguna, fotos con licencia abierta de <a href="https://www.inaturalist.org/">iNaturalist</a>. Algunas especies sin foto libre muestran una foto insertada de la <a href="https://www.macaulaylibrary.org/">Macaulay Library</a>, con el crédito dentro de la foto. El autor, la licencia y el original de cada foto están enlazados en la ficha de su especie. Las fotos se muestran reducidas, nunca recortadas.</dd>
    <dt>Mapa</dt>
    <dd><a href="https://www.naturalearthdata.com/">Natural Earth</a> (dominio público), a través del paquete <a href="https://github.com/topojson/world-atlas">world-atlas</a>.</dd>
  </dl>

  <h3>Notas sobre los grupos</h3>
  <p>Las notas breves de “Lo que tienen en común” se escribieron para este sitio y las revisó Lia Guttman. Las cifras de peso, pico, hábitat, países y estado que las acompañan se calculan a partir de los datos anteriores.</p>

  <h3>Modelos 3D</h3>
  <p>El Colibrí Cometa que a veces pasa volando: <a href="https://sketchfab.com/3d-models/red-tailed-comet-idle-animation-d5a551f91f8345629f4ff8ab49ac07f4">Red Tailed Comet Idle Animation</a> de <a href="https://sketchfab.com/burak.dag.u9">burak.dag.u9</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Se muestra con <a href="https://modelviewer.dev/">model-viewer</a> de Google (Apache 2.0).</p>
  <p>El ave de la página de anatomía: <a href="https://sketchfab.com/3d-models/swallow-tailed-hummingbird-db761226ef2b41b5b6dbdae5a80e715b">Swallow-tailed Hummingbird</a> de gelmi.com.br, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>
  <h3>Hecho con</h3>
  <p><a href="https://d3js.org/">D3</a> y <a href="https://github.com/topojson/topojson">TopoJSON</a> (licencia ISC). Tipografías: <a href="https://fonts.google.com/specimen/Newsreader">Newsreader</a> e <a href="https://fonts.google.com/specimen/IBM+Plex+Sans">IBM Plex Sans</a> (SIL Open Font License).</p>

  <h3>Privacidad</h3>
  <p>Las visitas se cuentan de forma anónima con <a href="https://www.cloudflare.com/web-analytics/">Cloudflare Web Analytics</a>, que no usa cookies ni rastrea a los visitantes individuales. El sitio tampoco usa cookies propias.</p>
</dialog>"""

src = (APP / "index.html").read_text()
m = re.search(r'<dialog class="credits".*?</dialog>', src, re.S)
digest = hashlib.sha256(m[0].encode()).hexdigest()[:16]
if CREDITS_EN_HASH != digest:
    if CREDITS_EN_HASH == "SET_ON_FIRST_RUN":
        print(f"Set CREDITS_EN_HASH = \"{digest}\" in this script.")
    else:
        sys.exit(f"About & credits changed in index.html (now {digest}). Update CREDITS_ES to match, then set CREDITS_EN_HASH = \"{digest}\".")
out = src.replace(m[0], CREDITS_ES)
for en, es in REPLACE:
    n = out.count(en)
    if n != 1:
        sys.exit(f"Expected this text once in index.html, found it {n} times:\n  {en}")
    out = out.replace(en, es)

(APP / "es").mkdir(exist_ok=True)
dest = APP / "es" / "index.html"
if not dest.exists() or dest.read_text() != out:
    dest.write_text(out)
print(f"{dest.relative_to(APP)} written ({len(REPLACE)} translations + About & credits)")
