/* A small 3D Red-tailed Comet that flies along the bottom of the screen when the page has been quiet
   for a while. It hovers in place under the pointer, and a click opens its species card.
   Model: "Red Tailed Comet Idle Animation" by burak.dag.u9 on Sketchfab, CC BY 4.0.
   The 3D viewer (Google's <model-viewer>) loads only after the page is ready and the bird is first needed. */
(function () {
  const IDLE_MS = 20000;      // quiet time before the first visit
  const BETWEEN_MS = 90000;   // at least this long between visits
  const SIZE = 150;           // px
  const CODE = "retcom1";     // Red-tailed Comet
  const VIEWER = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let el = null, flying = false, lastVisit = 0, idleTimer = 0, held = false;

  function quiet() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (Date.now() - lastVisit > BETWEEN_MS) fly(); else quiet(); }, IDLE_MS);
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => addEventListener(t, quiet, { passive: true }));

  function load() {
    if (el) return Promise.resolve(el);
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.type = "module"; s.src = VIEWER;
      document.head.appendChild(s);
      el = document.createElement("model-viewer");
      el.className = "comet";
      el.setAttribute("src", "models/comet.glb");
      el.setAttribute("alt", "A Red-tailed Comet hummingbird flying past");
      el.setAttribute("autoplay", "");
      el.setAttribute("loading", "eager");
      el.setAttribute("interaction-prompt", "none");
      el.setAttribute("disable-zoom", "");
      el.setAttribute("camera-orbit", "90deg 80deg auto");
      el.setAttribute("field-of-view", "24deg");
      el.setAttribute("exposure", "1.1");
      el.title = "Red-tailed Comet: click to meet it";
      el.style.width = el.style.height = SIZE + "px";
      el.addEventListener("pointerenter", () => { held = true; });
      el.addEventListener("pointerleave", () => { held = false; });
      el.addEventListener("click", () => { if (typeof select === "function") select(CODE); });
      el.addEventListener("load", () => resolve(el), { once: true });
      document.body.appendChild(el);
    });
  }

  // One pass: in from one side, a short hover partway along, then out the other side.
  async function fly(force) {
    if (flying || (document.hidden && !force)) return;
    if (document.querySelector("dialog[open]")) { quiet(); return; }
    flying = true; lastVisit = Date.now();
    const v = await load();
    const ltr = Math.random() < 0.5;
    const R = typeof stageRect === "function" ? stageRect(S.view) : { x0: 0, x1: innerWidth };
    const left = -SIZE, right = Math.max(R.x1, innerWidth * 0.5);
    const y0 = innerHeight - SIZE - (innerWidth <= 800 ? 60 : 44);
    // Seen from 90° the bird faces right; from 270° it faces left.
    v.setAttribute("camera-orbit", `${ltr ? 90 : 270}deg 80deg auto`);
    v.classList.add("on");
    const pauseAt = 0.35 + Math.random() * 0.3, travel = 9000, pause = 2200;
    let t = 0, last = performance.now(), pausedFor = 0;
    await new Promise((done) => {
      function step(now) {
        const dt = now - last; last = now;
        const atPause = t >= pauseAt && pausedFor < pause;
        if (held || atPause) { if (atPause && !held) pausedFor += dt; }
        else t += dt / travel;
        const p = ltr ? t : 1 - t;
        const x = left + (right - left) * p;
        const y = y0 + Math.sin(now / 420) * 6 + Math.sin(p * Math.PI * 3) * 14;
        v.style.transform = `translate(${x}px, ${y}px)`;
        if (t < 1) requestAnimationFrame(step); else done();
      }
      requestAnimationFrame(step);
    });
    v.classList.remove("on");
    flying = false; held = false;
    quiet();
  }

  window.cometFly = () => fly(true); // for testing from the console
  addEventListener("load", quiet);
})();
