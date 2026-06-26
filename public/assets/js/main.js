/* BlueCrest — interactions. Vanilla JS, no dependencies. */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOAD_TS = Date.now();

  /* ---------- branded fallback for any missing photo ---------- */
  function makeFallback(img) {
    const d = document.createElement("div");
    d.className = "img-fallback";
    d.innerHTML =
      '<div class="img-fallback__inner">' +
      '<svg class="img-fallback__drop" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c4 5.2 6.2 8.3 6.2 11.3a6.2 6.2 0 0 1-12.4 0C5.8 11.3 8 8.2 12 3z"/></svg>' +
      '<span class="img-fallback__label">' + (img.dataset.ph || "Photo") + "</span></div>";
    const cs = getComputedStyle(img);
    if (cs.position === "absolute") { d.style.position = "absolute"; d.style.inset = "0"; }
    else {
      const w = img.getAttribute("width"), h = img.getAttribute("height");
      d.style.aspectRatio = w && h ? `${w}/${h}` : "4/3";
      d.style.width = "100%";
    }
    img.replaceWith(d);
  }
  function guardImages() {
    $$("img[data-ph]").forEach((img) => {
      img.addEventListener("error", () => makeFallback(img), { once: true });
      if (img.complete && img.naturalWidth === 0) return makeFallback(img);
      // proactively probe so placeholders appear even for lazy, below-the-fold images
      const probe = new Image();
      probe.onerror = () => makeFallback(img);
      probe.src = img.currentSrc || img.src;
    });
  }

  /* ---------- header scroll state ---------- */
  const header = $("[data-header]");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
    const dock = $("[data-dock]");
    if (dock) dock.classList.toggle("is-visible", window.scrollY > 560);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav drawer ---------- */
  const toggle = $("[data-nav-toggle]");
  const drawer = $("[data-nav-drawer]");
  if (toggle && drawer) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$(".nav__drawer-link, .nav__drawer-actions a", drawer).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- scroll reveals ---------- */
  const reveal = $$(".reveal");
  const heroTitle = $("[data-hero-title]");
  if (heroTitle) requestAnimationFrame(() => heroTitle.classList.add("is-in"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        // stagger siblings within a list
        const sibs = $$(".reveal", el.parentElement).filter((n) => n.parentElement === el.parentElement);
        const idx = sibs.indexOf(el);
        el.style.transitionDelay = idx > 0 ? `${Math.min(idx, 6) * 70}ms` : "0ms";
        el.classList.add("is-in");
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveal.forEach((el) => io.observe(el));

    const proc = $("[data-process]");
    if (proc) {
      const pio = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); o.disconnect(); } }), { threshold: 0.3 });
      pio.observe(proc);
    }
  } else {
    reveal.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- before / after slider ---------- */
  const ba = $("[data-ba]");
  if (ba) {
    const stage = $(".ba__stage", ba);
    const range = $("[data-ba-range]", ba);
    const handle = $("[data-ba-handle]", ba);
    const setPos = (pct) => {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty("--pos", pct + "%");
      if (range) range.value = String(pct);
      if (handle) handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    };
    setPos(50);

    let dragging = false;
    const fromEvent = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setPos((x / r.width) * 100);
    };
    $$("img", ba).forEach((im) => { im.draggable = false; });
    stage.addEventListener("dragstart", (e) => e.preventDefault());
    stage.addEventListener("pointerdown", (e) => { e.preventDefault(); dragging = true; stage.setPointerCapture?.(e.pointerId); fromEvent(e); });
    stage.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    addEventListener("pointerup", () => { dragging = false; });
    if (range) {
      range.addEventListener("input", () => setPos(Number(range.value)));
      range.addEventListener("focus", () => stage.classList.add("is-focus"));
      range.addEventListener("blur", () => stage.classList.remove("is-focus"));
    }

    // swap surface
    const afterImg = $(".ba__img--after", ba);
    const beforeImg = $(".ba__img--before", ba);
    $$(".ba__thumb", ba).forEach((t) => {
      t.addEventListener("click", () => {
        $$(".ba__thumb", ba).forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
        t.classList.add("is-active"); t.setAttribute("aria-pressed", "true");
        const src = `/assets/img/${t.dataset.img}.jpg`;
        if (afterImg) afterImg.src = src;
        if (beforeImg) beforeImg.src = src;
        setPos(50);
      });
    });

    // one-time auto-nudge to teach the gesture
    if (!reduceMotion && "IntersectionObserver" in window) {
      let nudged = false;
      const nio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting || nudged) return;
        nudged = true; nio.disconnect();
        const start = performance.now(), dur = 1300;
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = Math.sin(t * Math.PI); // 0 -> 1 -> 0
          setPos(50 + ease * 14);
          if (t < 1) requestAnimationFrame(tick); else setPos(50);
        };
        requestAnimationFrame(tick);
      }), { threshold: 0.5 });
      nio.observe(ba);
    }
  }

  /* ---------- prefill service in the estimate form ---------- */
  const serviceSelect = $("#f-service");
  function prefillService(name) {
    if (!serviceSelect || !name) return;
    const opt = Array.from(serviceSelect.options).find((o) => o.value.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
    if (opt) serviceSelect.value = opt.value;
  }
  $$("[data-service]").forEach((el) => el.addEventListener("click", () => prefillService(el.dataset.service)));
  const urlSvc = new URLSearchParams(location.search).get("service");
  if (urlSvc) prefillService(urlSvc);

  /* ---------- idle pulse on persistent call buttons ---------- */
  if (!reduceMotion) {
    const pulses = $$("[data-pulse]");
    setInterval(() => pulses.forEach((p) => {
      p.classList.remove("pulsing"); void p.offsetWidth; p.classList.add("pulsing");
    }), 7000);
  }

  /* ---------- estimate form submit ---------- */
  const form = $("[data-estimate-form]");
  if (form) {
    const statusEl = $("[data-form-status]", form);
    const submitBtn = $("[data-submit]", form);
    const setStatus = (msg, kind) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.className = "form__status " + (kind === "ok" ? "is-ok" : "is-err");
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // minimal client validation
      const name = $("#f-name", form), phone = $("#f-phone", form);
      if (!name.value.trim() || !phone.value.trim()) {
        setStatus("Please add your name and a phone number so we can reach you.", "err");
        (!name.value.trim() ? name : phone).focus();
        return;
      }
      const payload = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        address: ($("#f-address", form)?.value || "").trim(),
        services: $("#f-service", form)?.value || "",
        message: ($("#f-message", form)?.value || "").trim(),
        company: $("#f-company", form)?.value || "", // honeypot
        _ts: LOAD_TS,
      };
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setStatus("Got it — thanks! Joshua or someone on the crew will text or call you shortly, usually within the hour.", "ok");
          form.reset();
        } else {
          setStatus(data.error || "Hmm, that didn't go through. Mind trying again, or just call us?", "err");
        }
      } catch {
        setStatus("Network hiccup — please try again, or call us at " + (window.SITE?.brand?.phone || "") + ".", "err");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send My Free Estimate"; }
      }
    });
  }

  guardImages();
})();
