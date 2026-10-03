/* "Inside a hummingbird": a 3D Swallow-tailed Hummingbird with a dot on each body part.
   Tapping a dot opens a short card written for kids, with links into the collection.
   Texts were reviewed and approved by Lia (Oct 2026); every fact has a source listed under it.
   Model: "Swallow-tailed Hummingbird" by gelmi.com.br on Sketchfab, CC BY 4.0. */
(function () {
  const VIEWER = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js";
  const MODEL = "models/swallowtail.glb";

  // pos/normal are points on the model's surface (model units), measured in the viewer.
  const PARTS = [
    {
      id: "bill", name: "Bill", pos: "-140 149 75", normal: "-0.14 0.85 0.50",
      kids: "A hummingbird's bill is long and thin, like a straw, so it can reach deep inside flowers. Each kind of hummingbird has a bill that fits the flowers it likes best.",
      wow: "The Sword-billed Hummingbird's bill is longer than its whole body, if you don't count the tail. No other bird in the world has that.",
      see: "Bills go from 11 mm to 97 mm. Meet the shortest and the longest:",
      meet: [["pubtho1", "Purple-backed Thornbill, 11 mm"], ["swbhum1", "Sword-billed Hummingbird, 97 mm"]],
      sources: [["Our species data (bill lengths)", ""], ["Sword-billed hummingbird, Wikipedia", "https://en.wikipedia.org/wiki/Sword-billed_hummingbird"]]
    },
    {
      id: "tongue", name: "Tongue", pos: "-174 153 72", normal: "0.12 0.71 0.69",
      kids: "The tongue hides inside the bill. Its tip splits in two, like a snake's tongue. When it touches nectar, tiny fringes open up, catch the nectar and pull it into the mouth.",
      wow: "Scientists once thought the tongue sucked nectar up like a straw. High-speed videos of 30 kinds of hummingbirds showed it works like a little trap instead.",
      sources: [["Rico-Guevara and Rubega, 2011 (UConn Today)", "https://today.uconn.edu/2011/05/uconn-researchers-debunk-hummingbird-theory"]]
    },
    {
      id: "eye", name: "Eye", pos: "-65.32 139.60 84.96", normal: "0.25 0.42 0.88",
      kids: "Hummingbirds see colors that we can't even imagine. They can see ultraviolet light, and mixes like ultraviolet plus green. That helps them find flowers.",
      wow: "Scientists tested this with wild Broad-tailed Hummingbirds in Colorado, using special lights and sugar-water feeders.",
      meet: [["brthum", "Broad-tailed Hummingbird"]],
      sources: [["Stoddard and others, 2020 (Princeton University)", "https://www.princeton.edu/news/2020/06/15/wild-hummingbirds-see-broad-range-colors-humans-can-only-imagine"], ["EarthSky", "https://earthsky.org/earth/wild-hummingbirds-see-colors-humans-can-only-imagine/"]]
    },
    {
      id: "gorget", name: "Gorget (throat)", pos: "-71.23 105.01 89.87", normal: "-0.19 0.15 0.97",
      kids: "Many males have shiny throat feathers called a gorget (say \"gor-jet\"). The color isn't paint. It comes from tiny, flat, bubbly shapes inside the feathers that bounce light, like a soap bubble. Males use it to impress females: they do a little dance in the air in front of her, and the gorget flashes as it catches the sunlight.",
      wow: "That's why the throat can look black one moment and blaze red or purple the next, when the bird turns its head.",
      meet: [["rthhum", "Ruby-throated Hummingbird"], ["annhum", "Anna's Hummingbird"]],
      sources: [["Field Museum, 2020", "https://www.fieldmuseum.org/about/press/hummingbirds-rainbow-colors-come-pancake-shaped-structures-their-feathers"], ["Simpson and McGraw, 2018 (ASU)", "https://asu.elsevierpure.com/en/publications/two-ways-to-display-male-hummingbirds-show-different-color-displa"]]
    },
    {
      id: "feathers", name: "Feathers", pos: "-13.96 60.13 98.37", normal: "-0.02 -0.17 0.98",
      kids: "Feathers keep a hummingbird warm, help it fly, and give it its colors. The shiny greens, blues and reds aren't colored at all: tiny shapes in the feathers bounce light back in a special way. This is called structural color, and when the color changes as you move it's called iridescence.",
      wow: "A Ruby-throated Hummingbird has only about 940 feathers, and it keeps every one clean and tidy for flying.",
      meet: [["rthhum", "Ruby-throated Hummingbird"]],
      sources: [["Journey North, \"How Many Feathers?\"", "https://archive.journeynorth.org/node/447.html"]]
    },
    {
      id: "wings", name: "Wings", pos: "122.71 112.71 141.88", normal: "-0.16 0.01 0.99",
      kids: "Hummingbirds can stop in the air, fly backwards and even upside down for a moment. Their wings move in a sideways figure eight, and they twist at the shoulder so they push air on the way forward and on the way back. Being so fast and quick to turn also helps them dodge danger: when something scares them, they spin away in a split second.",
      wow: "The biggest hummingbird beats its wings about 12 times a second. Tiny ones beat them so fast you only see a blur, but you can hear them: the wings make a humming sound. That's how hummingbirds got their name!",
      meet: [["giahum1", "Giant Hummingbird, the slow flapper (20 g)"]],
      sources: [["Stanford Birds, \"Hovering Flight\"", "https://web.stanford.edu/group/stanfordbirds/text/essays/Hovering_Flight.html"], ["Hummingbird, Wikipedia", "https://en.wikipedia.org/wiki/Hummingbird"], ["Escape manoeuvres in hummingbirds (University of Montana)", "https://umimpact.umt.edu/en/publications/flight-mechanics-and-control-of-escape-manoeuvres-in-hummingbirds-2/"]]
    },
    {
      id: "tail", name: "Tail", pos: "87.54 -95.90 99.02", normal: "0.83 0.55 0.14",
      kids: "The tail helps the bird steer and brake, like a rudder. Some hummingbirds have tails with long streamers or spoon-shaped tips.",
      wow: "A male Anna's Hummingbird \"sings\" with his tail. He dives at about 80 km/h (50 mph), spreads his tail feathers, and they buzz in the wind to make a loud chirp.",
      meet: [["annhum", "Anna's Hummingbird"], ["marspa1", "Marvelous Spatuletail (spoon-tipped tail)"], ["swthum1", "Swallow-tailed Hummingbird (this 3D bird)"]],
      sources: [["Clark and Feo, 2008 (UC Berkeley)", "https://newsarchive.berkeley.edu/news/media/releases/2008/01/30_hummingbird.shtml"]]
    },
    {
      id: "feet", name: "Feet", pos: "8.75 -17.19 77.34", normal: "-0.32 -0.54 0.77",
      kids: "Hummingbirds have tiny feet. They can't walk or hop. They use their feet to hold on to a branch, and they shuffle sideways.",
      wow: "Their bird group's name, Apodiformes, comes from Greek and means \"without feet\". They do have feet, just very small ones.",
      see: "Fun ones to tap: the racket-tails and the pufflegs, which wear fluffy \"pom-poms\" of feathers on their legs.",
      meet: [["boorat1", "White-booted Racket-tail"], ["genus:Eriocnemis", "The pufflegs"]],
      sources: [["Hummingbird, Wikipedia", "https://en.wikipedia.org/wiki/Hummingbird"], ["Apodiformes, Britannica", "https://www.britannica.com/animal/apodiform"], ["Puffleg, Wikipedia", "https://en.wikipedia.org/wiki/Puffleg"]]
    }
  ];

  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let dlg, mv, card, current = null;

  function loadViewer() {
    if (!document.querySelector(`script[src="${VIEWER}"]`)) {
      const s = document.createElement("script");
      s.type = "module"; s.src = VIEWER;
      document.head.appendChild(s);
    }
  }

  function build() {
    dlg = document.getElementById("anatomy");
    card = document.getElementById("anCard");
    const stage = document.getElementById("anStage");
    mv = document.createElement("model-viewer");
    mv.id = "anModel";
    Object.entries({
      src: MODEL, alt: "A 3D Swallow-tailed Hummingbird you can turn around", "camera-controls": "",
      "touch-action": "pan-y", "camera-orbit": "0deg 85deg auto", "interaction-prompt": "none",
      "shadow-intensity": "0.6", exposure: "1.1", loading: "eager", "min-camera-orbit": "auto auto 50%"
    }).forEach(([k, v]) => mv.setAttribute(k, v));
    PARTS.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "an-dot"; b.slot = `hotspot-${p.id}`;
      b.dataset.position = p.pos; b.dataset.normal = p.normal; b.dataset.part = p.id;
      b.dataset.visibilityAttribute = "visible";
      b.setAttribute("aria-label", p.name);
      b.innerHTML = `<span>${i + 1}</span>`;
      mv.appendChild(b);
    });
    stage.prepend(mv);
    dlg.addEventListener("click", onClick);
    dlg.addEventListener("close", () => { current = null; });
    showIntro();
  }

  function showIntro() {
    current = null;
    mark();
    card.innerHTML = `<p class="an-lede">Turn the bird with your finger or mouse, and tap a dot to learn about that part.</p>
      <ol class="an-list">${PARTS.map((p, i) => `<li><button data-part="${p.id}"><span>${i + 1}</span>${esc(p.name)}</button></li>`).join("")}</ol>`;
  }

  function show(id) {
    const i = PARTS.findIndex((p) => p.id === id), p = PARTS[i];
    if (!p) return;
    current = id;
    mark();
    const meet = (p.meet || []).map(([code, label]) => `<button class="an-meet" data-meet="${esc(code)}">${esc(label)}</button>`).join("");
    const src = p.sources.map(([t, u]) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(t))).join(" · ");
    card.innerHTML = `<button class="an-back" data-back>‹ All parts</button>
      <h3><span>${i + 1}</span>${esc(p.name)}</h3>
      <p>${esc(p.kids)}</p>
      <div class="an-wow"><b>Wow!</b> ${esc(p.wow)}</div>
      ${p.see || meet ? `<p class="an-see">${esc(p.see || "See it in the collection:")}</p><div class="an-meets">${meet}</div>` : ""}
      <p class="an-src">Sources: ${src}</p>
      <div class="an-steps"><button data-step="-1" aria-label="Previous part">‹</button><span>${i + 1} / ${PARTS.length}</span><button data-step="1" aria-label="Next part">›</button></div>`;
    card.scrollTop = 0;
  }

  function mark() {
    dlg.querySelectorAll(".an-dot").forEach((d) => d.classList.toggle("on", d.dataset.part === current));
  }

  function onClick(e) {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.matches("[data-close]")) return dlg.close();
    if (t.dataset.part) return show(t.dataset.part);
    if (t.matches("[data-back]")) return showIntro();
    if (t.dataset.step) {
      const i = PARTS.findIndex((p) => p.id === current);
      return show(PARTS[(i + +t.dataset.step + PARTS.length) % PARTS.length].id);
    }
    if (t.dataset.meet) {
      // Leave the anatomy page and open that species (or group) in the explorer.
      dlg.close();
      const m = t.dataset.meet;
      if (m.startsWith("genus:")) { pushFilter(taxonFilter("genus", m.slice(6))); if (S.view !== "family") setView("family"); }
      else select(m);
    }
  }

  function open() {
    if (!dlg) { loadViewer(); build(); }
    dlg.showModal();
  }

  document.getElementById("anatomyBtn").addEventListener("click", open);
  window.anatomyParts = PARTS; // for measuring dot positions from the console
})();
