// ============================================================================
//  SINGLE SOURCE OF TRUTH — edit this file to make the site yours.
//  Everything below (brand name, phone, services, reviews, areas, stats)
//  flows into the website automatically. Search for "← EDIT" for the
//  fields you'll most want to change.
// ============================================================================

export const SITE = {
  brand: {
    name: "Your Business Name",              // ← EDIT
    shortName: "Your Brand",                  // ← EDIT
    legalName: "Your Business Name, LLC",     // ← EDIT
    tagline: "Exterior cleaning, done right.",
    // Contact ----------------------------------------------------------------
    phone: "(555) 000-0000",                 // ← EDIT
    phoneHref: "+15550000000",               // ← EDIT (E.164, no spaces)
    email: "hello@yourbusiness.com",         // ← EDIT
    // Location & coverage ----------------------------------------------------
    city: "Your City",                       // ← EDIT
    state: "ST",                             // ← EDIT
    region: "the greater metro area",        // ← EDIT
    hours: "Mon–Sat · 7am–7pm",
    // Trust ------------------------------------------------------------------
    foundedYear: 2015,                       // ← EDIT
    license: "Licensed & fully insured",
    ownerName: "Owner Name",                 // ← EDIT
  },

  // Headline proof numbers (keep honest & specific) --------------------------
  stats: {
    yearsInBusiness: 10,                     // ← EDIT
    homesCleaned: 1000,                      // ← EDIT
    rating: 4.9,
    reviewCount: 200,                        // ← EDIT
    responseHours: 24,
    guaranteeDays: 100,
  },

  // The 6 services. `img` maps to /assets/img/<img>.jpg ----------------------
  services: [
    {
      id: "house", img: "house-wash", name: "House Soft Washing",
      benefit: "Strip algae and mildew off siding, brick and stucco — without forcing water behind your cladding.",
      priceFrom: 199,
    },
    {
      id: "driveway", img: "driveway", name: "Driveway & Concrete",
      benefit: "Lift years of oil, tire marks and mud for crisp, even, like-new flatwork.",
      priceFrom: 149,
    },
    {
      id: "roof", img: "roof", name: "Roof Soft Washing",
      benefit: "Kill the black algae streaks at the root — no pressure, no voided shingle warranty.",
      priceFrom: 349,
    },
    {
      id: "deck", img: "deck", name: "Deck & Fence Restoration",
      benefit: "Bring grayed, slippery wood back to its natural grain — ready to enjoy or re-stain.",
      priceFrom: 179,
    },
    {
      id: "patio", img: "patio", name: "Patio & Paver Cleaning",
      benefit: "Clear weed-choked joints and ground-in grime, then re-sand so it locks back together.",
      priceFrom: 169,
    },
    {
      id: "commercial", img: "commercial", name: "Commercial & Storefront",
      benefit: "Scheduled, after-hours exterior maintenance that keeps customers walking in.",
      priceFrom: null,
    },
  ],

  // 4-step process ----------------------------------------------------------
  process: [
    { step: "01", title: "Request your free estimate", text: "Tell us about your property in 60 seconds — online or by phone. No pushy sales calls, ever." },
    { step: "02", title: "Get a clear, fixed quote", text: "We assess and send an itemized, no-surprises price — usually within 24 hours." },
    { step: "03", title: "We make it look new", text: "Our uniformed, insured crew shows up on time, protects your landscaping, and gets to work." },
    { step: "04", title: "You enjoy the wow", text: "We walk the property with you. If you're not thrilled, we re-clean it free. Simple." },
  ],

  // Recent-work gallery (alternating rows). img maps to /assets/img/<img>.jpg
  gallery: [
    { img: "driveway",   surface: "Concrete driveway",    area: "Your City",    time: "Cleaned in one afternoon", quote: "Fifteen years of grime gone. I genuinely gasped." },
    { img: "roof",       surface: "Asphalt shingle roof",  area: "Nearby Town",  time: "Half-day soft wash",       quote: "Those embarrassing black streaks — completely gone. Looks brand new." },
    { img: "house-wash", surface: "Vinyl siding",          area: "Nearby Town",  time: "Single visit",             quote: "Quote came fast, price didn't change, results are unreal." },
    { img: "deck",       surface: "Cedar deck",            area: "Nearby Town",  time: "Cleaned & re-sealed",      quote: "Back to bare, beautiful wood. We're out there every evening now." },
  ],

  // Before / After comparison tiles (the signature slider) ------------------
  // Until you supply real matched pairs, the "before" is generated from the
  // "after" photo with a grime CSS filter (clearly footnoted on the site).
  beforeAfter: [
    { id: "driveway",  img: "driveway",   label: "Driveway" },
    { id: "roof",      img: "roof",       label: "Roof" },
    { id: "house",     img: "house-wash", label: "Siding" },
    { id: "deck",      img: "deck",       label: "Deck" },
  ],

  // Reviews -----------------------------------------------------------------
  testimonials: [
    { name: "Sarah M.", area: "Your City",   rating: 5, service: "House + Driveway", quote: "I genuinely gasped when they finished the driveway. Fifteen years of grime gone in an afternoon. The crew was polite, on time, and left everything spotless." },
    { name: "David R.", area: "Nearby Town", rating: 5, service: "Roof Soft Wash",   quote: "Those black streaks on my roof were embarrassing. Now it looks like a brand-new roof. Worth every penny." },
    { name: "Priya K.", area: "Nearby Town", rating: 5, service: "Full Exterior",    quote: "Quote came fast, price didn't change, and the results are unreal. Three neighbors have already asked for their number." },
    { name: "Tom B.",   area: "Nearby Town", rating: 5, service: "Patio & Pavers",   quote: "They got weeds and moss out of my paver joints I'd given up on, then re-sanded everything. Looks better than the day it was installed." },
  ],

  // Objection-handling FAQ ---------------------------------------------------
  faqs: [
    { q: "How much does pressure washing cost?", a: "Most homes land between $149 and $599 depending on size, surface and how much buildup we're removing. Your free estimate is an exact, itemized price — never a vague range, and never a surprise on the day." },
    { q: "Is the free estimate really free?", a: "Completely. No fee, no obligation, no high-pressure pitch. We assess your property, send a fixed quote, and you decide. That's it." },
    { q: "Will pressure washing damage my siding or roof?", a: "Not with us. Delicate surfaces like siding, roofs and wood are cleaned with low-pressure soft washing and the right detergents — we let the chemistry do the work, not brute force." },
    { q: "Are you licensed and insured?", a: "Yes — fully licensed, with general liability and workers' comp. We're happy to send a certificate of insurance before we ever step on your property." },
    { q: "Do I need to be home?", a: "Not necessarily. As long as we have access to the areas and an outdoor spigot, many customers are at work while we clean. We text you when we arrive and when we finish." },
    { q: "What if I'm not happy with the result?", a: "Then we're not done. Our 100-day guarantee means if a spot doesn't meet our standard, we come back and re-clean it free. You only pay when you're thrilled." },
  ],

  // Where you work — drives the service-area cloud & local SEO --------------
  serviceAreas: [
    "Your City", "Town 2", "Town 3", "Town 4",
    "Town 5",   "Town 6", "Town 7", "Town 8",
    "Town 9",   "Town 10", "Town 11", "Town 12",
  ],

  // The services dropdown in the estimate form ------------------------------
  formServices: [
    "House / Soft Washing", "Driveway & Concrete", "Roof Cleaning",
    "Deck & Fence", "Patio & Pavers", "Gutter Cleaning",
    "Commercial Property", "Full Exterior Package", "Something else",
  ],

  // SEO ---------------------------------------------------------------------
  seo: {
    title: "Your Business Name | Your City's Top-Rated Exterior Cleaning",
    description:
      "Premium pressure washing & soft washing in Your City and surrounding areas. Driveways, houses, roofs, decks & patios. Free, no-obligation estimates.",
    url: "https://www.yourbusiness.com",           // ← EDIT
  },
};

export default SITE;
