import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-secret');
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(cors());
app.use(express.json({ limit: '20mb' })); // Support base64 profile & receipt photos

app.get('/api/health', (_req, res) => {
  try {
    const database = db.prepare('SELECT sqlite_version() AS version').get();
    res.json({ status: 'ok', database: 'sqlite', version: database.version });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'කරුණාකර පළමුව ලොග් වන්න' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'වලංගු නොවන සත්‍යාපනයකි' });
    }
    req.user = user;
    next();
  });
};

const requireBodimaAccess = (req, res, next) => {
  const bodimaId = req.user?.bodimaId;
  if (!bodimaId) return res.status(403).json({ error: 'පළමුව බෝඩිමට සම්බන්ධ වන්න' });
  const requestedBodimaId = req.query.bodimaId || req.body?.bodimaId;
  if (requestedBodimaId && requestedBodimaId !== bodimaId) {
    return res.status(403).json({ error: 'මෙම බෝඩිමේ දත්ත වෙත ප්‍රවේශ වීමට අවසර නැත' });
  }
  req.bodimaId = bodimaId;
  next();
};

const requireBodimaAdmin = (req, res, next) => {
  if (!['admin', 'collector'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'මෙම ක්‍රියාව සඳහා භාරකරුගේ අවසරය අවශ්‍යයි' });
  }
  next();
};

// Formatter for User Object
const formatUser = (u) => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  email: u.email,
  role: u.role,
  roleTitleSi: u.role_title_si,
  roleTitleEn: u.role_title_en,
  avatar: u.avatar,
  bodimaId: u.bodima_id,
  eatsAtBodima: Boolean(u.eats_at_bodima),
  bankDetails: u.bank_account ? {
    bankName: u.bank_name,
    accountNumber: u.bank_account,
    accountName: u.bank_account_name,
    branch: u.bank_branch
  } : undefined
});

// --- USER AUTHENTICATION ROUTES (පරිශීලක පිවිසුම) ---

// 1. Get quick users list for easy login/selection
app.get('/api/auth/quick-users', (_req, res) => res.status(404).json({ error: 'Not found' }));

// 2. User login with Phone or Name and Password
app.post('/api/auth/user-login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'දුරකථන අංකය/නම සහ මුරපදය ඇතුළත් කරන්න' });
    }

    const trimmed = identifier.trim();
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE is_active = 1 AND (LOWER(name) = ? OR LOWER(name) LIKE ? OR phone = ? OR phone LIKE ? OR LOWER(email) = ? OR id = ?)
      LIMIT 1
    `).get(trimmed.toLowerCase(), `%${trimmed.toLowerCase()}%`, trimmed, `%${trimmed}%`, trimmed.toLowerCase(), trimmed);

    if (!user) {
      return res.status(404).json({ error: 'මෙම නමින් හෝ දුරකථන අංකයෙන් ගිණුමක් හමු නොවීය' });
    }

    // Check password if provided, or verify password_hash
    if (!user.password_hash || !bcrypt.compareSync(password.trim(), user.password_hash)) {
      return res.status(401).json({ error: 'මුරපදය (Password) වැරදියි!' });
    }

    const userObj = formatUser(user);
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    // Also get connected Bodima if user has one
    let bodimaObj = null;
    if (user.bodima_id) {
      const bodima = db.prepare('SELECT id, name, password FROM bodimas WHERE id = ?').get(user.bodima_id);
      if (bodima) {
        bodimaObj = bodima;
      }
    }

    res.json({
      success: true,
      user: userObj,
      bodima: bodimaObj,
      token,
      message: 'සාර්ථකව ලොග් විය!'
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ error: 'ලොග් වීමේදී දෝෂයක් ඇති විය' });
  }
});

// 3. User Register (ගිණුමක් සෑදීම)
app.post('/api/auth/user-register', (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'නම, දුරකථන අංකය සහ මුරපදය අත්‍යවශ්‍යයි' });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(name) = ? OR phone = ?').get(trimmedName.toLowerCase(), trimmedPhone);
    if (existing) {
      return res.status(400).json({ error: 'මෙම නමින් හෝ දුරකථන අංකයෙන් දැනටමත් ගිණුමක් ඇත. කරුණාකර ලොග් වන්න.' });
    }

    const newUserId = `u_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const passwordHash = bcrypt.hashSync(password.trim(), 10);
    const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    db.prepare(`
      INSERT INTO users (id, name, phone, email, password_hash, role, role_title_si, role_title_en, avatar, created_at)
      VALUES (?, ?, ?, ?, ?, 'member', 'සාමාජික', 'Boarder', ?, ?)
    `).run(newUserId, trimmedName, trimmedPhone, `${newUserId}@bodima.lk`, passwordHash, avatar, today);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
    const userObj = formatUser(newUser);
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      user: userObj,
      bodima: null,
      token,
      message: 'ගිණුම සාර්ථකව සාදන ලදී!'
    });
  } catch (error) {
    console.error('User register error:', error);
    res.status(500).json({ error: 'ගිණුම සෑදීමේදී දෝෂයක් ඇති විය' });
  }
});

// 4. Quick Login with User ID
app.post('/api/auth/quick-login', (_req, res) => res.status(404).json({ error: 'Not found' }));

// 5. Connect authenticated User to Bodima (බෝඩිමට සම්බන්ධ වීම)
app.post('/api/bodima/connect', authenticateToken, (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.user.id;

    if (!name || !password) {
      return res.status(400).json({ error: 'බෝඩිමේ නම සහ මුරපදය ඇතුළත් කරන්න' });
    }

    const trimmedName = name.trim();
    const bodima = db.prepare('SELECT * FROM bodimas WHERE LOWER(name) = ?').get(trimmedName.toLowerCase());
    if (!bodima) {
      return res.status(404).json({ error: 'මෙම නමින් බෝඩිමක් හමු නොවීය. කරුණාකර නම නිවැරදිදැයි බලන්න.' });
    }

    if (bodima.password !== password.trim()) {
      return res.status(401).json({ error: 'බෝඩිමේ මුරපදය (Password) වැරදියි!' });
    }

    // Associate user with this bodima
    db.prepare('UPDATE users SET bodima_id = ? WHERE id = ?').run(bodima.id, userId);

    // Ensure user has payment records in active collections for this bodima
    const activeCollections = db.prepare('SELECT id, target_per_person FROM collections WHERE bodima_id = ? AND is_completed = 0').all(bodima.id);
    const existingPayment = db.prepare('SELECT id FROM payments WHERE collection_id = ? AND user_id = ?');
    const insertPayment = db.prepare('INSERT INTO payments (id, collection_id, user_id, amount, is_paid) VALUES (?, ?, ?, ?, 0)');

    activeCollections.forEach((c, idx) => {
      const exists = existingPayment.get(c.id, userId);
      if (!exists) {
        insertPayment.run(`p_${Date.now()}_${idx}`, c.id, userId, c.target_per_person);
      }
    });

    const updatedUserRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const userObj = formatUser(updatedUserRaw);
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      bodima: {
        id: bodima.id,
        name: bodima.name,
        password: password.trim()
      },
      user: userObj,
      token,
      message: 'බෝඩිමට සාර්ථකව සම්බන්ධ විය!'
    });
  } catch (error) {
    console.error('Bodima connect error:', error);
    res.status(500).json({ error: 'බෝඩිමට සම්බන්ධ වීමේදී දෝෂයක් ඇති විය' });
  }
});

// --- BODIMA MULTI-TENANT ROUTES ---

// 1. Register a New Boarding House (බෝඩිමක් ලියාපදිංචි කිරීම)
app.post('/api/bodima/register', authenticateToken, (req, res) => {
  try {
    const { name, password } = req.body;

    const authUserId = req.user.id;
    if (req.user.bodimaId) {
      return res.status(403).json({ error: 'ඔබ දැනටමත් බෝඩිමකට සම්බන්ධයි' });
    }

    if (!name || !password) {
      return res.status(400).json({ error: 'බෝඩිමේ නම සහ මුරපදය අත්‍යවශ්‍යයි' });
    }

    const trimmedName = name.trim();
    const existing = db.prepare('SELECT id FROM bodimas WHERE LOWER(name) = ?').get(trimmedName.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'මෙම නමින් බෝඩිමක් දැනටමත් ලියාපදිංචි කර ඇත. වෙනත් නමක් තෝරන්න.' });
    }

    const bodimaId = `b_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const passwordHash = bcrypt.hashSync(password.trim(), 10);

    const creatorId = authUserId;
    if (!db.prepare('SELECT id FROM users WHERE id = ?').get(creatorId)) {
      return res.status(401).json({ error: 'ගිණුම නැවත පිවිසෙන්න' });
    }

    const runRegistration = db.transaction(() => {
      // Create Bodima
      db.prepare(`
        INSERT INTO bodimas (id, name, password, created_by, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(bodimaId, trimmedName, passwordHash, creatorId, today);

      db.prepare(`
        UPDATE users
        SET bodima_id = ?, role = 'admin', role_title_si = 'මාසික කුලී භාරකරු', role_title_en = 'Rent Collector / Admin'
        WHERE id = ?
      `).run(bodimaId, authUserId);
    });

    runRegistration();

    const createdUserRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(creatorId);
    const userObj = formatUser(createdUserRaw);

    const bodimaObj = {
      id: bodimaId,
      name: trimmedName,
      password: password.trim()
    };

    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      bodima: bodimaObj,
      user: userObj,
      token,
      message: 'බෝඩිම සාර්ථකව ලියාපදිංචි කරන ලදී!'
    });
  } catch (error) {
    console.error('Bodima register error:', error);
    res.status(500).json({ error: 'බෝඩිම ලියාපදිංචි කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// 2. Join an Existing Boarding House (බෝඩිමට සම්බන්ධ වීම)
app.post('/api/bodima/join', authenticateToken, (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.user.id;

    if (!name || !password) {
      return res.status(400).json({ error: 'බෝඩිමේ නම සහ මුරපදය ඇතුලත් කරන්න' });
    }

    const trimmedName = name.trim();
    const bodima = db.prepare('SELECT * FROM bodimas WHERE LOWER(name) = ?').get(trimmedName.toLowerCase());

    if (!bodima) {
      return res.status(404).json({ error: 'මෙම නමින් බෝඩිමක් හමු නොවීය. කරුණාකර නම නිවැරදිදැයි පරීක්ෂා කරන්න.' });
    }

    const validPassword = bodima.password.startsWith('$2')
      ? bcrypt.compareSync(password.trim(), bodima.password)
      : bodima.password === password.trim();
    if (!validPassword) {
      return res.status(401).json({ error: 'බෝඩිමේ මුරපදය (Password) වැරදියි!' });
    }

    let userObj = null;

    if (req.user.bodimaId && req.user.bodimaId !== bodima.id) {
      return res.status(403).json({ error: 'වෙනත් බෝඩිමකට මාරුවීමට පළමුව දැනට ඇති සම්බන්ධතාවයෙන් ඉවත් වන්න' });
    }
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!userRow) return res.status(404).json({ error: 'පරිශීලකයා හමු නොවීය' });
    db.prepare('UPDATE users SET bodima_id = ? WHERE id = ?').run(bodima.id, userId);
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    userObj = formatUser(updatedUser);

    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      bodima: {
        id: bodima.id,
        name: bodima.name,
        password: password.trim()
      },
      user: userObj,
      token,
      message: 'බෝඩිමට සාර්ථකව සම්බන්ධ විය!'
    });
  } catch (error) {
    console.error('Bodima join error:', error);
    res.status(500).json({ error: 'බෝඩිමට සම්බන්ධ වීමේදී දෝෂයක් ඇති විය' });
  }
});

// 3. Update User Profile, Bank Details & Photo from Settings
app.post('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone, avatar, roleTitleSi, role, bankDetails, eatsAtBodima } = req.body;
    const userId = req.user.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'පරිශීලකයා හමු නොවීය' });
    }

    const updatedName = name !== undefined ? name.trim() : user.name;
    const updatedPhone = phone !== undefined ? phone.trim() : user.phone;
    const updatedAvatar = avatar !== undefined ? avatar : user.avatar;
    const updatedRoleTitle = roleTitleSi !== undefined ? roleTitleSi : user.role_title_si;
    const updatedRole = user.role === 'admin' && role !== undefined ? role : user.role;
    const updatedEats = eatsAtBodima !== undefined ? (eatsAtBodima ? 1 : 0) : user.eats_at_bodima;

    const bankName = bankDetails?.bankName !== undefined ? bankDetails.bankName : user.bank_name;
    const bankAccount = bankDetails?.accountNumber !== undefined ? bankDetails.accountNumber : user.bank_account;
    const bankAccName = bankDetails?.accountName !== undefined ? bankDetails.accountName : user.bank_account_name;
    const bankBranch = bankDetails?.branch !== undefined ? bankDetails.branch : user.bank_branch;

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, avatar = ?, role_title_si = ?, role = ?,
          bank_name = ?, bank_account = ?, bank_account_name = ?, bank_branch = ?, eats_at_bodima = ?
      WHERE id = ?
    `).run(updatedName, updatedPhone, updatedAvatar, updatedRoleTitle, updatedRole, bankName, bankAccount, bankAccName, bankBranch, updatedEats, userId);

    const updatedBank = bankAccount ? {
      bankName,
      accountNumber: bankAccount,
      accountName: bankAccName,
      branch: bankBranch
    } : undefined;

    const updatedUser = {
      id: userId,
      name: updatedName,
      phone: updatedPhone,
      email: user.email,
      role: updatedRole,
      roleTitleSi: updatedRoleTitle,
      avatar: updatedAvatar,
      bodimaId: user.bodima_id,
      eatsAtBodima: Boolean(updatedEats),
      bankDetails: updatedBank
    };

    const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      user: updatedUser,
      token,
      message: 'ප්‍රොෆයිල් එක සාර්ථකව යාවත්කාලීන කරන ලදී'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'ප්‍රොෆයිල් එක යාවත්කාලීන කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// --- DATA ROUTES SCOPED BY BODIMA ---

// Get Users of a Bodima
app.get('/api/users', authenticateToken, requireBodimaAccess, (req, res) => {
  const users = db.prepare('SELECT id, name, phone, email, role, role_title_si as roleTitleSi, role_title_en as roleTitleEn, avatar, is_active as isActive, bodima_id as bodimaId, bank_name as bankName, bank_account as accountNumber, bank_account_name as accountName, bank_branch as branch, eats_at_bodima as eatsAtBodima FROM users WHERE bodima_id = ?').all(req.bodimaId);

  const formatted = users.map(u => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    roleDescriptionSi: u.roleTitleSi || 'සාමාජික',
    roleDescriptionEn: u.roleTitleEn || 'Boarder',
    avatar: u.avatar,
    isActive: Boolean(u.isActive),
    bodimaId: u.bodimaId,
    eatsAtBodima: u.eatsAtBodima !== 0,
    bankDetails: u.accountNumber ? {
      bankName: u.bankName,
      accountNumber: u.accountNumber,
      accountName: u.accountName,
      branch: u.branch
    } : undefined
  }));

  res.json(formatted);
});

app.post('/api/users', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const { id: requestedId, name, phone, roleDescriptionSi, roleDescriptionEn, avatar, isActive = true, eatsAtBodima = true } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'නම ඇතුළත් කරන්න' });
    const id = requestedId || `m_${Date.now()}`;
    const createdAt = new Date().toISOString().split('T')[0];
    const addMember = db.transaction(() => {
      db.prepare(`INSERT INTO users (id, name, phone, role_title_si, role_title_en, avatar, bodima_id, is_active, eats_at_bodima, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, name.trim(), phone || '', roleDescriptionSi || 'සාමාජික', roleDescriptionEn || 'Boarder', avatar || null, req.bodimaId, isActive ? 1 : 0, eatsAtBodima ? 1 : 0, createdAt);
      const activeCollections = db.prepare('SELECT id, target_per_person FROM collections WHERE bodima_id = ? AND is_completed = 0').all(req.bodimaId);
      const insertPayment = db.prepare('INSERT INTO payments (id, collection_id, user_id, amount, is_paid) VALUES (?, ?, ?, ?, 0)');
      activeCollections.forEach((pool, index) => insertPayment.run(`p_${Date.now()}_${index}`, pool.id, id, pool.target_per_person));
    });
    addMember();
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'සාමාජිකයා එක් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  const member = db.prepare('SELECT id FROM users WHERE id = ? AND bodima_id = ?').get(req.params.id, req.bodimaId);
  if (!member) return res.status(404).json({ error: 'සාමාජිකයා හමු නොවීය' });
  db.prepare('DELETE FROM payments WHERE user_id = ?').run(member.id);
  db.prepare('DELETE FROM users WHERE id = ? AND bodima_id = ?').run(member.id, req.bodimaId);
  res.json({ success: true });
});

app.patch('/api/users/:id', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const member = db.prepare('SELECT * FROM users WHERE id = ? AND bodima_id = ?').get(req.params.id, req.bodimaId);
    if (!member) return res.status(404).json({ error: 'සාමාජිකයා හමු නොවීය' });
    const { name, phone, roleDescriptionSi, roleDescriptionEn, avatar, isActive, eatsAtBodima } = req.body;
    db.prepare(`UPDATE users SET name = ?, phone = ?, role_title_si = ?, role_title_en = ?, avatar = ?, is_active = ?, eats_at_bodima = ? WHERE id = ? AND bodima_id = ?`)
      .run(name ?? member.name, phone ?? member.phone, roleDescriptionSi ?? member.role_title_si, roleDescriptionEn ?? member.role_title_en, avatar ?? member.avatar, isActive === undefined ? member.is_active : (isActive ? 1 : 0), eatsAtBodima === undefined ? member.eats_at_bodima : (eatsAtBodima ? 1 : 0), member.id, req.bodimaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'සාමාජිකයා යාවත්කාලීන කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Get Collections of a Bodima
app.get('/api/collections', authenticateToken, requireBodimaAccess, (req, res) => {
  const collections = db.prepare('SELECT * FROM collections WHERE bodima_id = ? ORDER BY created_at DESC').all(req.bodimaId);

  const results = collections.map(col => {
    const payments = db.prepare(`
      SELECT p.id, p.collection_id as collectionId, p.user_id as memberId, p.amount,
             p.is_paid as isPaid, p.paid_at as paidAt, p.payment_method as paymentMethod, p.note,
             u.name as memberName, u.avatar as memberAvatar, u.phone as memberPhone
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.collection_id = ?
    `).all(col.id);

    return {
      id: col.id,
      bodimaId: col.bodima_id,
      titleSi: col.title_si,
      titleEn: col.title_en,
      category: col.category,
      collectorId: col.collector_id,
      targetPerPerson: col.target_per_person,
      dueDate: col.due_date,
      cycle: col.cycle,
      descriptionSi: col.description_si,
      descriptionEn: col.description_en,
      participatingMemberIds: col.participating_member_ids ? JSON.parse(col.participating_member_ids) : undefined,
      collectorBankDetails: col.collector_bank_info ? JSON.parse(col.collector_bank_info) : undefined,
      isCompleted: Boolean(col.is_completed),
      createdAt: col.created_at,
      payments: payments.map(p => ({
        ...p,
        isPaid: Boolean(p.isPaid)
      }))
    };
  });

  res.json(results);
});

// Create Collection Pool with Selected Participating Members & Bank Info
app.post('/api/collections', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const {
      titleSi,
      titleEn,
      category,
      targetPerPerson,
      dueDate,
      cycle,
      descriptionSi,
      participatingMemberIds,
      collectorBankDetails
    } = req.body;

    const targetBodimaId = req.bodimaId;
    const collectorId = req.body.collectorId || req.user.id;
    const collector = db.prepare('SELECT id FROM users WHERE id = ? AND bodima_id = ? AND is_active = 1').get(collectorId, req.bodimaId);
    if (!collector) return res.status(400).json({ error: 'භාරකරු මෙම බෝඩිමේ සාමාජිකයෙකු විය යුතුයි' });

    const poolId = req.body.id || `col_${Date.now()}`;
    const createdAt = new Date().toISOString().split('T')[0];

    // Get active users of this bodima
    const allBodimaUsers = db.prepare('SELECT id, eats_at_bodima FROM users WHERE bodima_id = ? AND is_active = 1').all(targetBodimaId);

    // Determine target members: if specified, use that list; if food, default to eaters; else all
    let targetMemberIds = participatingMemberIds;
    if (!targetMemberIds || !Array.isArray(targetMemberIds) || targetMemberIds.length === 0) {
      if (category === 'food') {
        targetMemberIds = allBodimaUsers.filter(u => u.eats_at_bodima !== 0).map(u => u.id);
      } else {
        targetMemberIds = allBodimaUsers.map(u => u.id);
      }
    }

    const activeMemberIds = new Set(db.prepare('SELECT id FROM users WHERE bodima_id = ? AND is_active = 1').all(targetBodimaId).map(u => u.id));
    if (targetMemberIds.some(id => !activeMemberIds.has(id))) {
      return res.status(400).json({ error: 'තෝරාගත් සාමාජිකයන් මෙම බෝඩිමට අයත් නොවේ' });
    }

    // Get collector's bank details if not provided
    let bankInfo = collectorBankDetails;
    if (!bankInfo) {
      const collectorDetails = db.prepare('SELECT bank_name, bank_account, bank_account_name, bank_branch FROM users WHERE id = ? AND bodima_id = ?').get(collectorId, req.bodimaId);
      if (collectorDetails && collectorDetails.bank_account) {
        bankInfo = {
          bankName: collectorDetails.bank_name,
          accountNumber: collectorDetails.bank_account,
          accountName: collectorDetails.bank_account_name,
          branch: collectorDetails.bank_branch
        };
      }
    }

    db.prepare(`
      INSERT INTO collections (id, bodima_id, title_si, title_en, category, collector_id, target_per_person, due_date, cycle, description_si, description_en, participating_member_ids, collector_bank_info, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      poolId,
      targetBodimaId,
      titleSi,
      titleEn || titleSi,
      category,
      collectorId,
      targetPerPerson,
      dueDate,
      cycle,
      descriptionSi || '',
      descriptionSi || '',
      JSON.stringify(targetMemberIds),
      bankInfo ? JSON.stringify(bankInfo) : null,
      createdAt
    );

    // Add ONLY participating members to payments!
    const insertPayment = db.prepare(`
      INSERT INTO payments (id, collection_id, user_id, amount, is_paid)
      VALUES (?, ?, ?, ?, 0)
    `);

    targetMemberIds.forEach((uid, i) => {
      insertPayment.run(`p_${Date.now()}_${i}`, poolId, uid, targetPerPerson);
    });

    res.json({ success: true, id: poolId, participatingMemberIds: targetMemberIds });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'එකතුකිරීම සෑදීමේදී දෝෂයක් ඇති විය' });
  }
});

// Update payment status (ONLY Collector/Admin)
app.patch('/api/collections/:poolId/payments/:userId', authenticateToken, requireBodimaAccess, (req, res) => {
  try {
    const { poolId, userId } = req.params;
    const { isPaid, paymentMethod = 'cash', note } = req.body;

    const pool = db.prepare('SELECT collector_id FROM collections WHERE id = ? AND bodima_id = ?').get(poolId, req.bodimaId);
    if (!pool) return res.status(404).json({ error: 'එකතුකිරීම හමු නොවීය' });
    if (req.user.role !== 'admin' && pool.collector_id !== req.user.id) {
      return res.status(403).json({ error: 'ගෙවීම් යාවත්කාලීන කිරීමට අවසර නැත' });
    }

    const paidAt = isPaid ? new Date().toISOString().split('T')[0] : null;

    db.prepare(`
      UPDATE payments
      SET is_paid = ?, paid_at = ?, payment_method = ?, note = ?
      WHERE collection_id = ? AND user_id = ?
    `).run(isPaid ? 1 : 0, paidAt, isPaid ? paymentMethod : null, note || null, poolId, userId);

    const remainingUnpaid = db.prepare('SELECT COUNT(*) as count FROM payments WHERE collection_id = ? AND is_paid = 0').get(poolId);
    db.prepare('UPDATE collections SET is_completed = ? WHERE id = ?').run(remainingUnpaid.count === 0 ? 1 : 0, poolId);

    res.json({ success: true, isPaid: Boolean(isPaid) });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'ගෙවීම් තත්වය යාවත්කාලීන කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Complete / Settle collection pool (එකතුකිරීමේ වැඩේ ඉවර වූ පසු අවසන් කිරීම)
app.patch('/api/collections/:id/complete', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted = true } = req.body;
    const result = db.prepare('UPDATE collections SET is_completed = ? WHERE id = ? AND bodima_id = ?').run(isCompleted ? 1 : 0, id, req.bodimaId);
    if (!result.changes) return res.status(404).json({ error: 'එකතුකිරීම හමු නොවීය' });
    res.json({ success: true, isCompleted: Boolean(isCompleted) });
  } catch (error) {
    console.error('Complete collection error:', error);
    res.status(500).json({ error: 'එකතුකිරීම අවසන් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Delete a collection pool and its associated payments
app.delete('/api/collections/:id', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const collection = db.prepare('SELECT id FROM collections WHERE id = ? AND bodima_id = ?').get(id, req.bodimaId);
    if (!collection) return res.status(404).json({ error: 'එකතුකිරීම හමු නොවීය' });
    db.prepare('DELETE FROM payments WHERE collection_id = ?').run(id);
    db.prepare('DELETE FROM collections WHERE id = ? AND bodima_id = ?').run(id, req.bodimaId);
    res.json({ success: true, message: 'එකතුකිරීම සාර්ථකව ඉවත් කරන ලදී' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'එකතුකිරීම ඉවත් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Get Expenses of a Bodima
app.get('/api/expenses', authenticateToken, requireBodimaAccess, (req, res) => {
  let query = `
    SELECT e.id, e.bodima_id as bodimaId, e.title_si as titleSi, e.title_en as titleEn, e.category, e.amount,
           e.paid_by_id as paidById, e.date, e.receipt_url as receiptUrl, e.receipt_name as receiptName,
           e.notes, e.collection_pool_id as collectionPoolId, u.name as payerName, u.avatar as payerAvatar
    FROM expenses e
    LEFT JOIN users u ON e.paid_by_id = u.id
  `;
  const params = [];

  query += ' WHERE e.bodima_id = ?';
  params.push(req.bodimaId);

  query += ' ORDER BY e.date DESC';
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

app.post('/api/expenses', authenticateToken, requireBodimaAccess, (req, res) => {
  try {
    const { id: requestedId, titleSi, titleEn, category, amount, date, receiptUrl, receiptName, notes } = req.body;
    const targetBodimaId = req.bodimaId;
    const paidById = req.user.id;
    const id = requestedId || `exp_${Date.now()}`;
    const createdAt = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO expenses (id, bodima_id, title_si, title_en, category, amount, paid_by_id, date, receipt_url, receipt_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, targetBodimaId, titleSi, titleEn || titleSi, category, amount, paidById, date || createdAt, receiptUrl || null, receiptName || null, notes || null, createdAt);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'වියදම එක් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

app.delete('/api/expenses/:id', authenticateToken, requireBodimaAccess, (req, res) => {
  const result = db.prepare('DELETE FROM expenses WHERE id = ? AND bodima_id = ?').run(req.params.id, req.bodimaId);
  if (!result.changes) return res.status(404).json({ error: 'වියදම හමු නොවීය' });
  res.json({ success: true });
});

// Get Shopping Requests of a Bodima
app.get('/api/shopping', authenticateToken, requireBodimaAccess, (req, res) => {
  let query = `
    SELECT s.id, s.bodima_id as bodimaId, s.catalog_item_id as catalogItemId, s.name_si as nameSi, s.name_en as nameEn,
           s.unit_price as unitPrice, s.quantity, s.unit, s.requested_by_id as requestedById,
           s.requested_at as requestedAt, s.is_purchased as isPurchased, s.votes, s.notes,
           u.name as requesterName, u.avatar as requesterAvatar
    FROM shopping_requests s
    LEFT JOIN users u ON s.requested_by_id = u.id
  `;
  const params = [];

  query += ' WHERE s.bodima_id = ?';
  params.push(req.bodimaId);

  query += ' ORDER BY s.is_purchased ASC, s.requested_at DESC';
  const items = db.prepare(query).all(...params);

  const formatted = items.map(item => ({
    ...item,
    isPurchased: Boolean(item.isPurchased),
    votes: item.votes ? JSON.parse(item.votes) : []
  }));

  res.json(formatted);
});

app.post('/api/shopping', authenticateToken, requireBodimaAccess, (req, res) => {
  try {
    const { id: requestedId, nameSi, nameEn, unitPrice, quantity, unit, notes, catalogItemId } = req.body;
    const targetBodimaId = req.bodimaId;
    const requestedById = req.user.id;
    const id = requestedId || `req_${Date.now()}`;
    const requestedAt = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO shopping_requests (id, bodima_id, catalog_item_id, name_si, name_en, unit_price, quantity, unit, requested_by_id, requested_at, is_purchased, votes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, targetBodimaId, catalogItemId || null, nameSi, nameEn || nameSi, unitPrice, quantity, unit, requestedById, requestedAt, JSON.stringify([requestedById]), notes || null);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Add shopping request error:', error);
    res.status(500).json({ error: 'බඩු ඉල්ලීම එක්කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Toggle vote on shopping request
app.post('/api/shopping/:id/vote', authenticateToken, requireBodimaAccess, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = db.prepare('SELECT votes FROM shopping_requests WHERE id = ? AND bodima_id = ?').get(id, req.bodimaId);
    if (!item) return res.status(404).json({ error: 'අයිතමය හමු නොවීය' });

    let votes = item.votes ? JSON.parse(item.votes) : [];
    if (votes.includes(userId)) {
      votes = votes.filter(v => v !== userId);
    } else {
      votes.push(userId);
    }

    db.prepare('UPDATE shopping_requests SET votes = ? WHERE id = ?').run(JSON.stringify(votes), id);
    res.json({ success: true, votes });
  } catch (error) {
    res.status(500).json({ error: 'ඡන්දය ප්‍රකාශ කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

app.patch('/api/shopping/mark-purchased', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  const result = db.prepare('UPDATE shopping_requests SET is_purchased = 1 WHERE bodima_id = ? AND is_purchased = 0').run(req.bodimaId);
  res.json({ success: true, updated: result.changes });
});

app.delete('/api/shopping/:id', authenticateToken, requireBodimaAccess, (req, res) => {
  const result = db.prepare('DELETE FROM shopping_requests WHERE id = ? AND bodima_id = ?').run(req.params.id, req.bodimaId);
  if (!result.changes) return res.status(404).json({ error: 'අයිතමය හමු නොවීය' });
  res.json({ success: true });
});

// Toggle purchased
app.patch('/api/shopping/:id/purchased', authenticateToken, requireBodimaAccess, requireBodimaAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT is_purchased FROM shopping_requests WHERE id = ? AND bodima_id = ?').get(id, req.bodimaId);
    if (!current) return res.status(404).json({ error: 'අයිතමය හමු නොවීය' });
    const newStatus = current.is_purchased ? 0 : 1;
    db.prepare('UPDATE shopping_requests SET is_purchased = ? WHERE id = ? AND bodima_id = ?').run(newStatus, id, req.bodimaId);
    res.json({ success: true, isPurchased: Boolean(newStatus) });
  } catch (error) {
    res.status(500).json({ error: 'තත්වය වෙනස් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Convert list to expense
app.post('/api/shopping/convert-to-expense', authenticateToken, requireBodimaAccess, (req, res) => {
  try {
    const paidById = req.user.id;
    const targetBodimaId = req.bodimaId;
    const unpurchased = db.prepare('SELECT * FROM shopping_requests WHERE bodima_id = ? AND is_purchased = 0').all(targetBodimaId);

    if (unpurchased.length === 0) {
      return res.status(400).json({ error: 'මිලදී ගැනීමට අයිතම නොමැත' });
    }

    const total = unpurchased.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const notes = unpurchased.map(i => `${i.name_si} (${i.quantity} ${i.unit})`).join(', ');

    const expId = `exp_${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO expenses (id, bodima_id, title_si, title_en, category, amount, paid_by_id, date, notes, created_at)
      VALUES (?, ?, ?, ?, 'food', ?, ?, ?, ?, ?)
    `).run(expId, targetBodimaId, `සතිපතා බඩු ගැනීම (${unpurchased.length} අයිතම)`, `Weekly Groceries (${unpurchased.length} items)`, total, paidById, date, notes, date);

    db.prepare('UPDATE shopping_requests SET is_purchased = 1 WHERE bodima_id = ? AND is_purchased = 0').run(targetBodimaId);

    res.json({ success: true, expenseId: expId, total });
  } catch (error) {
    res.status(500).json({ error: 'වියදමක් බවට හැරවීමේදී දෝෂයක් ඇති විය' });
  }
});

// Catalog routes
app.get('/api/catalog', (req, res) => {
  const items = db.prepare('SELECT id, name_si as nameSi, name_en as nameEn, category, unit, estimated_price as estimatedPrice, last_updated as lastUpdated FROM catalog_items ORDER BY name_si ASC').all();
  res.json(items);
});

// Serve frontend build in production
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bodima Multi-Tenant SQLite API running at http://0.0.0.0:${PORT}`);
});
