# BlueCrest Pressure Washing — premium lead-gen website

A conversion-focused marketing site + lead-capture backend for a local pressure
washing business. Hand-built (no page-builder, no framework bloat): a fast,
server-rendered front end with a real Node/Express backend that stores free-estimate
requests, handles optional photo uploads, and emails you new leads.

Design system: warm cream · deep teal · gold ink · Fraunces + Inter (self-hosted).
Everything is data-driven from **one config file** so it's quick to rebrand.

---

## Quick start

```bash
npm install
npm start
```

Then open **http://localhost:3000**. The admin lead dashboard URL (with its token)
is printed in the console on startup, e.g. `http://localhost:3000/admin?key=…`.

> Requires Node 22.5+ (uses the built-in `node:sqlite`). No database to install.

---

## Make it yours (edit one file)

Open **`src/config.js`** and change the fields marked `← EDIT`:

- **Business name, phone, email, city/region** — flow into every section, the
  footer NAP, click-to-call links, and SEO/JSON-LD automatically.
- **Services**, **reviews**, **FAQs**, **service areas**, **stats** — all live here.
- Owner name, guarantee length, hours, founding year.

No HTML editing needed for any of that. Restart the server to see changes.

## Add your photos

Drop your images into **`public/assets/img/`** using these exact names
(`.jpg`). Anything missing shows a tasteful branded placeholder until you add it:

| File | Used for |
|------|----------|
| `house-wash.jpg` | Hero, siding service, gallery |
| `driveway.jpg`   | Driveway service, before/after |
| `roof.jpg`       | Roof service, before/after |
| `deck.jpg`       | Deck service, before/after |
| `patio.jpg`      | Patio service |
| `commercial.jpg` | Commercial service |
| `owner.jpg`      | "Meet the owner" portrait/crew/truck |

**Before/After slider:** until you supply true matched pairs, the "before" is the
real photo with a grime filter applied (clearly footnoted on the site). When you
have real before/after pairs, that's the single highest-converting asset in this
niche — ask and we'll wire them in.

---

## Email notifications (optional)

Copy `.env.example` → `.env` and fill in SMTP details to get an email on every new
lead. Leave `SMTP_HOST` blank to disable email (leads are still saved to the DB).
Also set a fixed `ADMIN_TOKEN` there so the admin URL stays constant.

## Where leads go

- Stored in **`data/leads.db`** (SQLite). Falls back to `data/leads.json` if needed.
- View them at **`/admin?key=YOUR_TOKEN`** or as JSON at `/api/leads?key=YOUR_TOKEN`.
- Uploaded photos are saved privately in `data/uploads/` (never served publicly).
- The whole `data/` folder is git-ignored (it contains customer info).

---

## What's built in

- **Server-rendered** from config — real text in the HTML for SEO (not JS-injected).
- **Security:** Helmet + per-request CSP nonce, gzip, rate-limiting, honeypot +
  timing spam traps, input validation (zod).
- **Lead form:** works with or without JavaScript; optional photo upload; graceful
  thank-you page for no-JS submissions.
- **SEO:** LocalBusiness + FAQPage JSON-LD, `/sitemap.xml`, `/robots.txt`, per-town
  service-area links.
- **Self-hosted fonts** — zero third-party requests, fast, privacy-friendly.
- **Accessible & responsive** — keyboard-operable before/after slider, skip link,
  reduced-motion support, mobile sticky call/estimate dock.

## Project layout

```
server.js                 Express app: rendering, lead API, admin, SEO routes
src/config.js             ← your single source of truth (edit this)
src/index.template.html   page template ({{tokens}} + {{html.partials}})
src/render.js             builds sections from config + injects values
src/db.js                 SQLite (or JSON) lead store
public/assets/            css, self-hosted fonts, js, your images
scripts/fetch-fonts.mjs   re-download/self-host the Google fonts
scripts/fetch-images.mjs  optional: pull placeholder imagery (Wikimedia)
```

## Helper scripts

- `npm run fetch-fonts` — re-generate the self-hosted font files.
- `npm run dev` — start with auto-reload (`node --watch`).
