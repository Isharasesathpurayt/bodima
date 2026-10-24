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

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDir, 'bodima.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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

// Empty default state - users create their own bodima and items
export const sampleReceiptUrl = "";

export default db;
