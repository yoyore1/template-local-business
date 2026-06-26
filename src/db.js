// Lead store. Prefers the built-in node:sqlite (real SQL, zero native deps);
// transparently falls back to an atomic JSON file if sqlite isn't available.
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

const SQLITE_PATH = path.join(DATA_DIR, "leads.db");
const JSON_PATH = path.join(DATA_DIR, "leads.json");

let driver = null; // 'sqlite' | 'json'
let db = null;

try {
  const { DatabaseSync } = await import("node:sqlite");
  db = new DatabaseSync(SQLITE_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT NOT NULL,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL,
      email         TEXT,
      zip           TEXT,
      address       TEXT,
      services      TEXT,
      property_type TEXT,
      message       TEXT,
      contact_pref  TEXT,
      photo         TEXT,
      source        TEXT,
      referrer      TEXT,
      ip            TEXT,
      user_agent    TEXT,
      status        TEXT NOT NULL DEFAULT 'new'
    );
  `);
  driver = "sqlite";
} catch {
  driver = "json";
  if (!existsSync(JSON_PATH)) writeFileSync(JSON_PATH, "[]");
}

function readJson() {
  try { return JSON.parse(readFileSync(JSON_PATH, "utf8")); } catch { return []; }
}
function writeJsonAtomic(rows) {
  const tmp = `${JSON_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(rows, null, 2));
  renameSync(tmp, JSON_PATH); // atomic on same filesystem
}

export function insertLead(lead) {
  const row = {
    created_at: new Date().toISOString(),
    name: lead.name, phone: lead.phone, email: lead.email ?? null,
    zip: lead.zip ?? null, address: lead.address ?? null,
    services: JSON.stringify(lead.services ?? []),
    property_type: lead.propertyType ?? null,
    message: lead.message ?? null, contact_pref: lead.contactPref ?? null,
    photo: lead.photo ?? null,
    source: lead.source ?? "website", referrer: lead.referrer ?? null,
    ip: lead.ip ?? null, user_agent: lead.userAgent ?? null, status: "new",
  };

  if (driver === "sqlite") {
    const stmt = db.prepare(`
      INSERT INTO leads (created_at,name,phone,email,zip,address,services,property_type,message,contact_pref,photo,source,referrer,ip,user_agent,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const r = stmt.run(
      row.created_at, row.name, row.phone, row.email, row.zip, row.address,
      row.services, row.property_type, row.message, row.contact_pref, row.photo,
      row.source, row.referrer, row.ip, row.user_agent, row.status
    );
    return { id: Number(r.lastInsertRowid), ...row };
  }

  const rows = readJson();
  const id = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
  const saved = { id, ...row };
  rows.push(saved);
  writeJsonAtomic(rows);
  return saved;
}

export function listLeads(limit = 200) {
  if (driver === "sqlite") {
    return db.prepare(`SELECT * FROM leads ORDER BY id DESC LIMIT ?`).all(limit);
  }
  return readJson().sort((a, b) => b.id - a.id).slice(0, limit);
}

export function countLeads() {
  if (driver === "sqlite") {
    return db.prepare(`SELECT COUNT(*) AS n FROM leads`).get().n;
  }
  return readJson().length;
}

export const dbInfo = { driver };
