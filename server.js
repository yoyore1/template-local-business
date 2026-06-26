import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import multer from "multer";
import { z } from "zod";
import crypto from "node:crypto";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SITE } from "./src/config.js";
import { renderPage } from "./src/render.js";
import { insertLead, listLeads, countLeads, dbInfo } from "./src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(12).toString("hex");
const TEMPLATE = readFileSync(path.join(__dirname, "src", "index.template.html"), "utf8");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// ---- Security headers (CSP w/ per-request nonce for the one inline script) --
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(express.json({ limit: "32kb" }));

// ---- Static assets (long cache; html is rendered fresh) --------------------
app.use(
  "/assets",
  express.static(path.join(__dirname, "public", "assets"), {
    maxAge: "7d",
    setHeaders: (res, p) => {
      if (/\.(jpg|jpeg|png|webp|svg|woff2?)$/.test(p)) res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    },
  })
);

// ---- Home (server-rendered from config) ------------------------------------
app.get("/", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.type("html").send(renderPage(TEMPLATE, SITE, { nonce: res.locals.nonce }));
});

// ---- Lead capture ----------------------------------------------------------
const estimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests — please call us instead." },
});

// Optional photo upload — stored privately in data/uploads (never web-served).
const UPLOAD_DIR = path.join(__dirname, "data", "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${path.extname(file.originalname).slice(0, 8)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});
// Never let a bad upload block a lead — swallow upload errors and continue.
const photoUpload = (req, res, next) =>
  upload.single("photo")(req, res, (err) => { if (err) req.fileError = err.message; next(); });

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const wantsJson = (req) => req.get("x-requested-with") === "fetch" || req.is("application/json");

function thankYouHtml(name) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thanks — ${SITE.brand.name}</title>
  <style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:#FBFAF7;color:#16282C;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem}
  .card{max-width:520px}h1{font-size:1.9rem;margin:0 0 .6rem}p{color:#5E6B6E;line-height:1.6}a{display:inline-block;margin-top:1.4rem;background:#1F6A6F;color:#fff;padding:.85rem 1.4rem;border-radius:999px;text-decoration:none;font-weight:600}</style>
  <div class="card"><h1>Thanks${name ? ", " + name.replace(/[<>&]/g, "") : ""}! 🚿</h1>
  <p>We've got your request. ${SITE.brand.ownerName || "Our crew"} will reach out shortly — usually within the hour. Prefer to talk now? Call <strong>${SITE.brand.phone}</strong>.</p>
  <a href="/">Back to ${SITE.brand.shortName}</a></div>`;
}

const EstimateSchema = z.object({
  name: z.string({ required_error: "Please enter your name" }).trim().min(2, "Please enter your name").max(80),
  phone: z.string({ required_error: "Please add a phone number" }).trim().min(7, "Please enter a valid phone number").max(30),
  email: z.string().trim().email("Please enter a valid email").max(120).optional().or(z.literal("")),
  zip: z.string().trim().max(12).optional().or(z.literal("")),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  services: z.preprocess(asArray, z.array(z.string().max(80)).max(12)).optional(),
  propertyType: z.enum(["residential", "commercial"]).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  contactPref: z.enum(["phone", "text", "email"]).optional().or(z.literal("")),
  // anti-spam — honeypot is accepted by the schema, then handled silently below
  company: z.string().max(120).optional(),
  _ts: z.coerce.number().optional(),
});

let mailer = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

async function notify(lead) {
  if (!mailer) return;
  const to = process.env.LEAD_NOTIFY_TO || SITE.brand.email;
  let svc = "—"; try { svc = JSON.parse(lead.services || "[]").join(", ") || "—"; } catch {}
  await mailer.sendMail({
    from: process.env.SMTP_FROM || `"${SITE.brand.name}" <${SITE.brand.email}>`,
    to,
    subject: `🚿 New free-estimate request — ${lead.name}`,
    text: [
      `New lead from the website:`, ``,
      `Name:     ${lead.name}`,
      `Phone:    ${lead.phone}`,
      `Email:    ${lead.email || "—"}`,
      `Address:  ${lead.address || lead.zip || "—"}`,
      `Services: ${svc}`,
      `Photo:    ${lead.photo ? "data/uploads/" + lead.photo : "—"}`,
      ``, `Message:`, lead.message || "—",
    ].join("\n"),
  }).catch((e) => console.error("[mail] failed:", e.message));
}

app.post("/api/estimate", estimateLimiter, photoUpload, async (req, res) => {
  const json = wantsJson(req);
  const parsed = EstimateSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const error = first?.message || "Please check the form and try again.";
    return json
      ? res.status(400).json({ ok: false, error })
      : res.status(400).type("html").send(`<!doctype html><meta charset=utf-8><body style="font-family:system-ui;padding:3rem;color:#16282C"><p>${error}</p><a href="/#estimate">← Go back</a></body>`);
  }
  const d = parsed.data;

  // Silent spam handling: honeypot filled, or submitted suspiciously fast.
  const tooFast = d._ts && Date.now() - d._ts < 2500;
  if ((d.company && d.company.length) || tooFast) {
    return json ? res.json({ ok: true }) : res.type("html").send(thankYouHtml(d.name));
  }

  let saved;
  try {
    saved = insertLead({
      name: d.name, phone: d.phone, email: d.email, zip: d.zip, address: d.address,
      services: d.services || [], propertyType: d.propertyType || null,
      message: d.message, contactPref: d.contactPref || null,
      photo: req.file ? req.file.filename : null,
      source: "website", referrer: (req.get("referer") || "").slice(0, 200),
      ip: req.ip, userAgent: (req.get("user-agent") || "").slice(0, 300),
    });
  } catch (e) {
    console.error("[db] insert failed:", e.message);
    const error = "Something went wrong saving your request. Please call us.";
    return json ? res.status(500).json({ ok: false, error }) : res.status(500).type("html").send(error);
  }

  notify(saved); // fire-and-forget email
  console.log(`[lead] #${saved.id}  ${saved.name}  ${saved.phone}  (${(d.services || []).join(", ") || "—"})${saved.photo ? "  +photo" : ""}`);
  return json ? res.json({ ok: true, id: saved.id }) : res.type("html").send(thankYouHtml(d.name));
});

// ---- Health & SEO ----------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ ok: true, db: dbInfo.driver, leads: countLeads() }));

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${SITE.seo.url}/sitemap.xml\n`);
});
app.get("/sitemap.xml", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE.seo.url}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n</urlset>\n`
  );
});

// ---- Admin (token-gated lead dashboard) ------------------------------------
function checkAuth(req, res) {
  const token = req.query.key || (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (token !== ADMIN_TOKEN) {
    res.status(401).type("html").send(`<body style="font-family:system-ui;background:#0b1220;color:#e6edf6;padding:3rem"><h1>401</h1><p>Add <code>?key=YOUR_ADMIN_TOKEN</code> to the URL. The token is printed in the server console at startup.</p></body>`);
    return false;
  }
  return true;
}

app.get("/api/leads", (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json({ ok: true, count: countLeads(), leads: listLeads(500) });
});

app.get("/admin", (req, res) => {
  if (!checkAuth(req, res)) return;
  const leads = listLeads(500);
  const rows = leads.map((l) => {
    let svc = l.services; try { svc = JSON.parse(l.services).join(", "); } catch {}
    return `<tr>
      <td>#${l.id}</td>
      <td>${new Date(l.created_at).toLocaleString()}</td>
      <td><strong>${l.name}</strong></td>
      <td><a href="tel:${l.phone}">${l.phone}</a></td>
      <td>${l.email || "—"}</td>
      <td>${l.zip || "—"}</td>
      <td>${svc || "—"}</td>
      <td>${(l.message || "").replace(/</g, "&lt;")}</td>
    </tr>`;
  }).join("");
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leads · ${SITE.brand.name}</title>
  <style>
    :root{color-scheme:dark}
    body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:#0b1220;color:#e6edf6;margin:0;padding:2rem}
    h1{font-size:1.4rem;margin:0 0 .25rem} .sub{color:#8aa0b8;margin:0 0 1.5rem}
    table{width:100%;border-collapse:collapse;font-size:.875rem}
    th,td{text-align:left;padding:.6rem .75rem;border-bottom:1px solid #1d2a3d;vertical-align:top}
    th{color:#8aa0b8;font-weight:600;text-transform:uppercase;font-size:.7rem;letter-spacing:.05em}
    tr:hover td{background:#0f1a2b} a{color:#5cc8ff} td:nth-child(8){max-width:320px;color:#b8c6d6}
    .pill{display:inline-block;background:#11233a;color:#5cc8ff;padding:.2rem .6rem;border-radius:999px;font-size:.75rem}
  </style></head><body>
  <h1>${SITE.brand.name} — Leads</h1>
  <p class="sub"><span class="pill">${leads.length} total</span> &nbsp; store: ${dbInfo.driver}</p>
  <table><thead><tr><th>ID</th><th>When</th><th>Name</th><th>Phone</th><th>Email</th><th>ZIP</th><th>Services</th><th>Message</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="8" style="color:#8aa0b8;padding:2rem">No leads yet.</td></tr>`}</tbody></table>
  </body></html>`);
});

app.use((req, res) => res.status(404).type("html").send(renderPage(TEMPLATE, SITE, { nonce: res.locals.nonce })));

app.listen(PORT, () => {
  console.log(`\n  ${SITE.brand.name}`);
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  Admin:   http://localhost:${PORT}/admin?key=${ADMIN_TOKEN}`);
  console.log(`  ➜  Storage: ${dbInfo.driver}${process.env.ADMIN_TOKEN ? "" : "   (ADMIN_TOKEN auto-generated for this run)"}\n`);
});
