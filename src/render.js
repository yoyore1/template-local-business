// Renders index.template.html against SITE config: replaces {{token.path}} with
// escaped values, {{html.partial}} with prebuilt markup, injects window.SITE.
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const priceLabel = (s) => (s.priceFrom ? `from&nbsp;$${s.priceFrom}` : "Custom quote");
const STAR = `<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z"/></svg>`;
const stars = (n) => STAR.repeat(Math.round(n));

// data-ph drives the branded fallback panel if a photo file is missing.
const img = (file, alt, label, w, h, cls = "", eager = false) =>
  `<img src="/assets/img/${file}.jpg" alt="${esc(alt)}" data-ph="${esc(label)}"${cls ? ` class="${cls}"` : ""} width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

function serviceIndex(site) {
  return site.services
    .map(
      (s) => `
      <a class="svc reveal" href="#estimate" data-service="${esc(s.name)}">
        <span class="svc__num">${esc(String(site.services.indexOf(s) + 1).padStart(2, "0"))}</span>
        <span class="svc__main">
          <span class="svc__name">${esc(s.name)}</span>
          <span class="svc__benefit">${esc(s.benefit)}</span>
        </span>
        <span class="svc__price">${priceLabel(s)}</span>
        <span class="svc__thumb" aria-hidden="true">${img(s.img, "", s.name, 320, 220)}</span>
        <span class="svc__go" aria-hidden="true">→</span>
      </a>`
    )
    .join("");
}

function processCols(site) {
  return site.process
    .map(
      (p) => `
      <li class="step reveal">
        <span class="step__num">${esc(p.step)}</span>
        <h3 class="step__title">${esc(p.title)}</h3>
        <p class="step__text">${esc(p.text)}</p>
      </li>`
    )
    .join("");
}

function gallery(site) {
  return site.gallery
    .map(
      (g, i) => `
      <article class="work reveal${i % 2 ? " work--flip" : ""}">
        <figure class="work__media">
          <span class="work__wipe">${img(g.img, `${g.surface} cleaned by ${site.brand.name} in ${g.area}`, g.surface, 1000, 640)}</span>
        </figure>
        <div class="work__caption">
          <span class="work__surface">${esc(g.surface)}</span>
          <span class="work__area">${esc(g.area)} · ${esc(g.time)}</span>
          <p class="work__quote">“${esc(g.quote)}”</p>
        </div>
      </article>`
    )
    .join("");
}

function beforeAfter(site) {
  const tiles = site.beforeAfter;
  const first = tiles[0];
  const thumbs = tiles
    .map(
      (t, i) => `<button class="ba__thumb${i === 0 ? " is-active" : ""}" type="button" data-img="${esc(t.img)}" data-label="${esc(t.label)}" aria-pressed="${i === 0}">${esc(t.label)}</button>`
    )
    .join("");
  return `
    <div class="ba" data-ba>
      <figure class="ba__stage">
        <img class="ba__img ba__img--after" src="/assets/img/${esc(first.img)}.jpg" alt="After: a freshly cleaned surface" data-ph="${esc(first.label)} — after" width="1040" height="650" decoding="async">
        <div class="ba__before" data-ba-before>
          <img class="ba__img ba__img--before" src="/assets/img/${esc(first.img)}.jpg" alt="Before: the same surface with built-up grime" data-ph="${esc(first.label)} — before" width="1040" height="650" decoding="async" aria-hidden="true">
        </div>
        <span class="ba__tag ba__tag--before">Before</span>
        <span class="ba__tag ba__tag--after">After</span>
        <div class="ba__handle" data-ba-handle role="slider" tabindex="0" aria-label="Drag to compare before and after" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <span class="ba__grip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg></span>
        </div>
        <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Before / after comparison slider" data-ba-range>
      </figure>
      <div class="ba__thumbs" role="group" aria-label="Choose a surface to compare">${thumbs}</div>
      <p class="ba__note">Before view shown for reference; after photos are real ${esc(site.brand.shortName)} jobs.</p>
    </div>`;
}

function reviews(site) {
  const [f, b1, b2] = site.testimonials;
  const sec = (t) => `
    <figure class="rev__col">
      <div class="rev__stars" aria-label="${t.rating} out of 5 stars">${stars(t.rating)}</div>
      <blockquote>${esc(t.quote)}</blockquote>
      <figcaption>${esc(t.name)} · ${esc(t.area)} · ${esc(t.service)}</figcaption>
    </figure>`;
  return `
    <figure class="rev__feature reveal">
      <div class="rev__stars rev__stars--lg" aria-label="${f.rating} out of 5 stars">${stars(f.rating)}</div>
      <blockquote class="rev__quote">“${esc(f.quote)}”</blockquote>
      <figcaption class="rev__by">${esc(f.name)} · ${esc(f.area)} · ${esc(f.service)}</figcaption>
    </figure>
    <div class="rev__cols reveal">${sec(b1)}${sec(b2)}</div>`;
}

function faqs(site) {
  return site.faqs
    .map(
      (f, i) => `
      <details class="faq reveal"${i === 0 ? " open" : ""}>
        <summary class="faq__q">${esc(f.q)}<span class="faq__icon" aria-hidden="true"></span></summary>
        <div class="faq__a"><p>${esc(f.a)}</p></div>
      </details>`
    )
    .join("");
}

const areaChips = (site) => site.serviceAreas.map((a) => `<li class="chip">${esc(a)}</li>`).join("");
const areaCloseList = (site) => site.serviceAreas.map((a) => `<li>${esc(a)}</li>`).join("");
const areaFooter = (site) => site.serviceAreas.map((a) => `<li><a href="#estimate">Pressure washing in ${esc(a)}</a></li>`).join("");
const serviceFooter = (site) => site.services.map((s) => `<li><a href="#services">${esc(s.name)}</a></li>`).join("");
const formOptions = (site) => site.formServices.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");

function jsonLd(site) {
  const business = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    name: site.brand.name,
    image: `${site.seo.url}/assets/img/house-wash.jpg`,
    "@id": site.seo.url,
    url: site.seo.url,
    telephone: site.brand.phoneHref,
    email: site.brand.email,
    priceRange: "$$",
    address: { "@type": "PostalAddress", addressLocality: site.brand.city, addressRegion: site.brand.state, addressCountry: "US" },
    areaServed: site.serviceAreas.map((name) => ({ "@type": "City", name })),
    aggregateRating: { "@type": "AggregateRating", ratingValue: site.stats.rating, reviewCount: site.stats.reviewCount },
    openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "07:00", closes: "19:00" },
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: site.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return `<script type="application/ld+json">${JSON.stringify(business)}</script>\n<script type="application/ld+json">${JSON.stringify(faqPage)}</script>`;
}

const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderPage(template, site, opts = {}) {
  const year = new Date().getFullYear();
  const ext = {
    ...site,
    stats: { ...site.stats, homesCleanedFmt: site.stats.homesCleaned.toLocaleString("en-US") },
    year,
  };

  const partials = {
    "html.serviceIndex": serviceIndex(site),
    "html.process": processCols(site),
    "html.gallery": gallery(site),
    "html.beforeAfter": beforeAfter(site),
    "html.reviews": reviews(site),
    "html.faqs": faqs(site),
    "html.areaChips": areaChips(site),
    "html.areaCloseList": areaCloseList(site),
    "html.areaFooter": areaFooter(site),
    "html.serviceFooter": serviceFooter(site),
    "html.formServiceOptions": formOptions(site),
    "html.jsonLd": jsonLd(site),
    "html.year": String(year),
  };

  const clientSite = {
    brand: { name: site.brand.name, phone: site.brand.phone, phoneHref: site.brand.phoneHref, email: site.brand.email },
    stats: site.stats,
  };
  const nonceAttr = opts.nonce ? ` nonce="${opts.nonce}"` : "";
  const inject = `<script${nonceAttr}>window.SITE=${JSON.stringify(clientSite)};</script>`;

  const out = template.replace(TOKEN, (m, key) => {
    if (key in partials) return partials[key];
    const v = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ext);
    return v == null ? "" : esc(v);
  });

  return out.replace("</head>", `${inject}\n</head>`);
}
