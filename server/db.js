import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bodima.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize / Update tables
db.exec(`
  CREATE TABLE IF NOT EXISTS bodimas (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'member', -- 'admin', 'collector', 'member'
    role_title_si TEXT,
    role_title_en TEXT,
    avatar TEXT,
    bodima_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    bodima_id TEXT,
    title_si TEXT NOT NULL,
    title_en TEXT,
    category TEXT NOT NULL,
    collector_id TEXT NOT NULL,
    target_per_person REAL NOT NULL,
    due_date TEXT NOT NULL,
    cycle TEXT NOT NULL,
    description_si TEXT,
    description_en TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    is_paid INTEGER DEFAULT 0,
    paid_at TEXT,
    payment_method TEXT,
    note TEXT,
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    bodima_id TEXT,
    title_si TEXT NOT NULL,
    title_en TEXT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_by_id TEXT NOT NULL,
    date TEXT NOT NULL,
    receipt_url TEXT,
    receipt_name TEXT,
    notes TEXT,
    collection_pool_id TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS shopping_requests (
    id TEXT PRIMARY KEY,
    bodima_id TEXT,
    catalog_item_id TEXT,
    name_si TEXT NOT NULL,
    name_en TEXT,
    unit_price REAL NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    requested_by_id TEXT NOT NULL,
    requested_at TEXT,
    is_purchased INTEGER DEFAULT 0,
    votes TEXT DEFAULT '[]',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS catalog_items (
    id TEXT PRIMARY KEY,
    bodima_id TEXT,
    name_si TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    estimated_price REAL NOT NULL,
    last_updated TEXT
  );
`);

// Graceful column migrations for existing databases
const addColumnSafe = (table, column, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  } catch (e) {
    // Column already exists
  }
};

addColumnSafe('users', 'bodima_id', 'TEXT');
addColumnSafe('users', 'bank_name', 'TEXT');
addColumnSafe('users', 'bank_account', 'TEXT');
addColumnSafe('users', 'bank_account_name', 'TEXT');
addColumnSafe('users', 'bank_branch', 'TEXT');
addColumnSafe('users', 'eats_at_bodima', 'INTEGER DEFAULT 1');

addColumnSafe('collections', 'bodima_id', 'TEXT');
addColumnSafe('collections', 'participating_member_ids', 'TEXT');
addColumnSafe('collections', 'collector_bank_info', 'TEXT');

addColumnSafe('expenses', 'bodima_id', 'TEXT');
addColumnSafe('shopping_requests', 'bodima_id', 'TEXT');
addColumnSafe('catalog_items', 'bodima_id', 'TEXT');

// Sample receipt SVG representation
export const sampleReceiptUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560' viewBox='0 0 400 560' fill='%23fefefe'><rect width='400' height='560' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='2'/><path d='M0,0 L20,10 L40,0 L60,10 L80,0 L100,10 L120,0 L140,10 L160,0 L180,10 L200,0 L220,10 L240,0 L260,10 L280,0 L300,10 L320,0 L340,10 L360,0 L380,10 L400,0' fill='none' stroke='%23cbd5e1' stroke-width='2'/><text x='200' y='55' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='%230f172a'>CARGILLS FOOD CITY</text><text x='200' y='78' font-family='sans-serif' font-size='13' text-anchor='middle' fill='%2364748b'>High Level Rd, Maharagama</text><text x='200' y='96' font-family='sans-serif' font-size='11' text-anchor='middle' fill='%2394a3b8'>Tel: 011-2850021 | VAT: 12345678</text><line x1='30' y1='115' x2='370' y2='115' stroke='%23334155' stroke-dasharray='4,4'/><text x='30' y='140' font-family='sans-serif' font-size='12' fill='%23475569'>Date: 2026-10-16 18:42</text><text x='370' y='140' font-family='sans-serif' font-size='12' text-anchor='end' fill='%23475569'>Bill: %2389421</text><line x1='30' y1='155' x2='370' y2='155' stroke='%23e2e8f0'/><text x='30' y='180' font-family='sans-serif' font-size='13' fill='%231e293b'>Nadu Rice 5kg</text><text x='370' y='180' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>1,150.00</text><text x='30' y='210' font-family='sans-serif' font-size='13' fill='%231e293b'>Red Dhal 2kg</text><text x='370' y='210' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>680.00</text><text x='30' y='240' font-family='sans-serif' font-size='13' fill='%231e293b'>Eggs 10 Pack</text><text x='370' y='240' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>380.00</text><text x='30' y='270' font-family='sans-serif' font-size='13' fill='%231e293b'>Coconut Oil 1L</text><text x='370' y='270' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>650.00</text><text x='30' y='300' font-family='sans-serif' font-size='13' fill='%231e293b'>Sunlight Soap x3</text><text x='370' y='300' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>390.00</text><text x='30' y='330' font-family='sans-serif' font-size='13' fill='%231e293b'>Soya Meat x4</text><text x='370' y='330' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>560.00</text><line x1='30' y1='360' x2='370' y2='360' stroke='%23334155' stroke-width='2'/><text x='30' y='395' font-family='sans-serif' font-size='16' font-weight='bold' fill='%230f172a'>TOTAL (Rs.)</text><text x='370' y='395' font-family='sans-serif' font-size='18' font-weight='bold' text-anchor='end' fill='%23059669'>3,810.00</text><text x='30' y='425' font-family='sans-serif' font-size='12' fill='%2364748b'>Cash Tendered: 4,000.00</text><text x='370' y='425' font-family='sans-serif' font-size='12' text-anchor='end' fill='%2364748b'>Change: 190.00</text><line x1='30' y1='450' x2='370' y2='450' stroke='%23e2e8f0'/><text x='200' y='490' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%23475569'>*** THANK YOU COME AGAIN ***</text><text x='200' y='515' font-family='sans-serif' font-size='10' text-anchor='middle' fill='%2394a3b8'>Verified for Bodima System</text><path d='M0,560 L20,550 L40,560 L60,550 L80,560 L100,550 L120,560 L140,550 L160,560 L180,550 L200,560 L220,550 L240,560 L260,550 L280,560 L300,550 L320,560 L340,550 L360,560 L380,550 L400,560' fill='none' stroke='%23cbd5e1' stroke-width='2'/></svg>";

// Seed default "අපේ බෝඩිම" (Password: 1234) if not exists
const defaultBodima = db.prepare('SELECT id FROM bodimas WHERE name = ?').get('අපේ බෝඩිම');
if (!defaultBodima) {
  const bodimaId = 'b_default';
  db.prepare(`
    INSERT INTO bodimas (id, name, password, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(bodimaId, 'අපේ බෝඩිම', '1234', 'u1', '2026-10-01');

  // Also add English alias for quick access
  db.prepare(`
    INSERT OR IGNORE INTO bodimas (id, name, password, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('b_ape_bodima', 'Ape Bodima', '1234', 'u1', '2026-10-01');

  // Ensure default users belong to this bodima
  db.prepare(`UPDATE users SET bodima_id = ? WHERE bodima_id IS NULL OR bodima_id = ''`).run(bodimaId);
  db.prepare(`UPDATE collections SET bodima_id = ? WHERE bodima_id IS NULL OR bodima_id = ''`).run(bodimaId);
  db.prepare(`UPDATE expenses SET bodima_id = ? WHERE bodima_id IS NULL OR bodima_id = ''`).run(bodimaId);
  db.prepare(`UPDATE shopping_requests SET bodima_id = ? WHERE bodima_id IS NULL OR bodima_id = ''`).run(bodimaId);
  db.prepare(`UPDATE catalog_items SET bodima_id = ? WHERE bodima_id IS NULL OR bodima_id = ''`).run(bodimaId);
}

export default db;
