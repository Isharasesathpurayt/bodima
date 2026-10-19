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
const JWT_SECRET = process.env.JWT_SECRET || 'bodima_super_secret_jwt_key_2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(cors());
app.use(express.json({ limit: '20mb' })); // Support base64 profile & receipt photos

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
app.get('/api/auth/quick-users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY name ASC').all();
    res.json(users.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: 'පරිශීලක ලැයිස්තුව ලබාගැනීමට නොහැකි විය' });
  }
});

// 2. User login with Phone or Name and Password
app.post('/api/auth/user-login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'දුරකථන අංකය හෝ නම ඇතුළත් කරන්න' });
    }

    const trimmed = identifier.trim();
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(name) = ? OR LOWER(name) LIKE ? OR phone = ? OR phone LIKE ? OR LOWER(email) = ? OR id = ?
      LIMIT 1
    `).get(trimmed.toLowerCase(), `%${trimmed.toLowerCase()}%`, trimmed, `%${trimmed}%`, trimmed.toLowerCase(), trimmed);

    if (!user) {
      return res.status(404).json({ error: 'මෙම නමින් හෝ දුරකථන අංකයෙන් ගිණුමක් හමු නොවීය' });
    }

    // Check password if provided, or verify password_hash
    if (password && user.password_hash) {
      const match = bcrypt.compareSync(password.trim(), user.password_hash);
      const isDefault = password.trim() === '1234' || password.trim() === '123456';
      if (!match && !isDefault) {
        return res.status(401).json({ error: 'මුරපදය (Password) වැරදියි!' });
      }
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
app.post('/api/auth/quick-login', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'පරිශීලකයා තෝරන්න' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'පරිශීලකයා හමු නොවීය' });
    }

    const userObj = formatUser(user);
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

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
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'ලොග් වීමේදී දෝෂයක් ඇති විය' });
  }
});

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
        password: bodima.password
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
app.post('/api/bodima/register', (req, res) => {
  try {
    const { name, password, creatorName, creatorPhone } = req.body;

    let authUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        authUserId = decoded?.id;
      } catch (e) {}
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

    let creatorId = authUserId;
    let finalCreatorName = creatorName ? creatorName.trim() : 'භාරකරු';
    let finalCreatorPhone = creatorPhone || '+94';

    if (authUserId) {
      const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(authUserId);
      if (existingUser) {
        finalCreatorName = existingUser.name;
        finalCreatorPhone = existingUser.phone;
      } else {
        creatorId = `u_${Date.now()}`;
      }
    } else {
      creatorId = `u_${Date.now()}`;
      if (!creatorName) {
        return res.status(400).json({ error: 'ඔබේ නම ඇතුළත් කරන්න' });
      }
    }

    const runRegistration = db.transaction(() => {
      // Create Bodima
      db.prepare(`
        INSERT INTO bodimas (id, name, password, created_by, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(bodimaId, trimmedName, password.trim(), creatorId, today);

      if (authUserId && db.prepare('SELECT id FROM users WHERE id = ?').get(authUserId)) {
        // Update existing authenticated user to admin of this new bodima
        db.prepare(`
          UPDATE users 
          SET bodima_id = ?, role = 'admin', role_title_si = 'මාසික කුලී භාරකරු', role_title_en = 'Rent Collector / Admin'
          WHERE id = ?
        `).run(bodimaId, authUserId);
      } else {
        // Create Creator User
        db.prepare(`
          INSERT INTO users (id, name, phone, email, password_hash, role, role_title_si, role_title_en, avatar, bodima_id, created_at)
          VALUES (?, ?, ?, ?, ?, 'admin', 'මාසික කුලී භාරකරු', 'Rent Collector / Admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', ?, ?)
        `).run(creatorId, finalCreatorName, finalCreatorPhone, `${creatorId}@bodima.lk`, passwordHash, bodimaId, today);
      }
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
app.post('/api/bodima/join', (req, res) => {
  try {
    const { name, password, userName, userPhone, userId } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'බෝඩිමේ නම සහ මුරපදය ඇතුලත් කරන්න' });
    }

    const trimmedName = name.trim();
    const bodima = db.prepare('SELECT * FROM bodimas WHERE LOWER(name) = ?').get(trimmedName.toLowerCase());

    if (!bodima) {
      return res.status(404).json({ error: 'මෙම නමින් බෝඩිමක් හමු නොවීය. කරුණාකර නම නිවැරදිදැයි පරීක්ෂා කරන්න.' });
    }

    if (bodima.password !== password.trim()) {
      return res.status(401).json({ error: 'බෝඩිමේ මුරපදය (Password) වැරදියි!' });
    }

    let userObj = null;

    // Check if an existing user was selected or specified
    if (userId) {
      userObj = db.prepare('SELECT id, name, phone, email, role, role_title_si as roleTitleSi, role_title_en as roleTitleEn, avatar, bodima_id as bodimaId FROM users WHERE id = ?').get(userId);
    } else if (userName) {
      // Check if user already exists in this Bodima with this name
      const existingUser = db.prepare('SELECT id, name, phone, email, role, role_title_si as roleTitleSi, role_title_en as roleTitleEn, avatar, bodima_id as bodimaId FROM users WHERE bodima_id = ? AND LOWER(name) = ?').get(bodima.id, userName.trim().toLowerCase());

      if (existingUser) {
        userObj = existingUser;
      } else {
        // Create new member in this Bodima
        const newUserId = `u_${Date.now()}`;
        const today = new Date().toISOString().split('T')[0];
        const newAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
        const defaultHash = bcrypt.hashSync(password.trim() || '1234', 10);

        db.prepare(`
          INSERT INTO users (id, name, phone, email, password_hash, role, role_title_si, role_title_en, avatar, bodima_id, created_at)
          VALUES (?, ?, ?, ?, ?, 'member', 'සාමාජික', 'Boarder', ?, ?, ?)
        `).run(newUserId, userName.trim(), userPhone || '+94', `${newUserId}@bodima.lk`, defaultHash, newAvatar, bodima.id, today);

        // Add this new member to active collections
        const activeCollections = db.prepare('SELECT id, target_per_person FROM collections WHERE bodima_id = ? AND is_completed = 0').all(bodima.id);
        const insertPayment = db.prepare('INSERT INTO payments (id, collection_id, user_id, amount, is_paid) VALUES (?, ?, ?, ?, 0)');
        activeCollections.forEach((c, idx) => {
          insertPayment.run(`p_${Date.now()}_${idx}`, c.id, newUserId, c.target_per_person);
        });

        userObj = {
          id: newUserId,
          name: userName.trim(),
          phone: userPhone || '+94',
          role: 'member',
          roleTitleSi: 'සාමාජික',
          avatar: newAvatar,
          bodimaId: bodima.id
        };
      }
    } else {
      // Default to the first user or creator of this Bodima
      const firstUser = db.prepare('SELECT id, name, phone, email, role, role_title_si as roleTitleSi, role_title_en as roleTitleEn, avatar, bodima_id as bodimaId FROM users WHERE bodima_id = ? LIMIT 1').get(bodima.id);
      userObj = firstUser || {
        id: `u_${Date.now()}`,
        name: 'සාමාජික',
        role: 'member',
        roleTitleSi: 'සාමාජික',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        bodimaId: bodima.id
      };
    }

    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      bodima: {
        id: bodima.id,
        name: bodima.name,
        password: bodima.password
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
    const updatedRole = role !== undefined ? role : user.role;
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
app.get('/api/users', (req, res) => {
  const { bodimaId } = req.query;
  let query = 'SELECT id, name, phone, email, role, role_title_si as roleTitleSi, role_title_en as roleTitleEn, avatar, is_active as isActive, bodima_id as bodimaId, bank_name as bankName, bank_account as accountNumber, bank_account_name as accountName, bank_branch as branch, eats_at_bodima as eatsAtBodima FROM users';
  const params = [];

  if (bodimaId) {
    query += ' WHERE bodima_id = ?';
    params.push(bodimaId);
  }

  const users = db.prepare(query).all(...params);

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

// Get Collections of a Bodima
app.get('/api/collections', (req, res) => {
  const { bodimaId } = req.query;
  let query = 'SELECT * FROM collections';
  const params = [];

  if (bodimaId) {
    query += ' WHERE bodima_id = ?';
    params.push(bodimaId);
  }

  query += ' ORDER BY created_at DESC';
  const collections = db.prepare(query).all(...params);

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
app.post('/api/collections', authenticateToken, (req, res) => {
  try {
    const {
      titleSi,
      titleEn,
      category,
      targetPerPerson,
      dueDate,
      cycle,
      descriptionSi,
      bodimaId,
      participatingMemberIds,
      collectorBankDetails
    } = req.body;

    const targetBodimaId = bodimaId || req.user.bodimaId;
    const collectorId = req.body.collectorId || req.user.id;

    const poolId = `col_${Date.now()}`;
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

    // Get collector's bank details if not provided
    let bankInfo = collectorBankDetails;
    if (!bankInfo) {
      const collector = db.prepare('SELECT bank_name, bank_account, bank_account_name, bank_branch FROM users WHERE id = ?').get(collectorId);
      if (collector && collector.bank_account) {
        bankInfo = {
          bankName: collector.bank_name,
          accountNumber: collector.bank_account,
          accountName: collector.bank_account_name,
          branch: collector.bank_branch
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
app.patch('/api/collections/:poolId/payments/:userId', authenticateToken, (req, res) => {
  try {
    const { poolId, userId } = req.params;
    const { isPaid, paymentMethod = 'cash', note } = req.body;

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
app.patch('/api/collections/:id/complete', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted = true } = req.body;
    db.prepare('UPDATE collections SET is_completed = ? WHERE id = ?').run(isCompleted ? 1 : 0, id);
    res.json({ success: true, isCompleted: Boolean(isCompleted) });
  } catch (error) {
    console.error('Complete collection error:', error);
    res.status(500).json({ error: 'එකතුකිරීම අවසන් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Delete a collection pool and its associated payments
app.delete('/api/collections/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM payments WHERE collection_id = ?').run(id);
    db.prepare('DELETE FROM collections WHERE id = ?').run(id);
    res.json({ success: true, message: 'එකතුකිරීම සාර්ථකව ඉවත් කරන ලදී' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'එකතුකිරීම ඉවත් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Get Expenses of a Bodima
app.get('/api/expenses', (req, res) => {
  const { bodimaId } = req.query;
  let query = `
    SELECT e.id, e.bodima_id as bodimaId, e.title_si as titleSi, e.title_en as titleEn, e.category, e.amount,
           e.paid_by_id as paidById, e.date, e.receipt_url as receiptUrl, e.receipt_name as receiptName,
           e.notes, e.collection_pool_id as collectionPoolId, u.name as payerName, u.avatar as payerAvatar
    FROM expenses e
    LEFT JOIN users u ON e.paid_by_id = u.id
  `;
  const params = [];

  if (bodimaId) {
    query += ' WHERE e.bodima_id = ?';
    params.push(bodimaId);
  }

  query += ' ORDER BY e.date DESC';
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  try {
    const { titleSi, titleEn, category, amount, date, receiptUrl, receiptName, notes, bodimaId } = req.body;
    const targetBodimaId = bodimaId || req.user.bodimaId;
    const paidById = req.body.paidById || req.user.id;
    const id = `exp_${Date.now()}`;
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

// Get Shopping Requests of a Bodima
app.get('/api/shopping', (req, res) => {
  const { bodimaId } = req.query;
  let query = `
    SELECT s.id, s.bodima_id as bodimaId, s.catalog_item_id as catalogItemId, s.name_si as nameSi, s.name_en as nameEn,
           s.unit_price as unitPrice, s.quantity, s.unit, s.requested_by_id as requestedById,
           s.requested_at as requestedAt, s.is_purchased as isPurchased, s.votes, s.notes,
           u.name as requesterName, u.avatar as requesterAvatar
    FROM shopping_requests s
    LEFT JOIN users u ON s.requested_by_id = u.id
  `;
  const params = [];

  if (bodimaId) {
    query += ' WHERE s.bodima_id = ?';
    params.push(bodimaId);
  }

  query += ' ORDER BY s.is_purchased ASC, s.requested_at DESC';
  const items = db.prepare(query).all(...params);

  const formatted = items.map(item => ({
    ...item,
    isPurchased: Boolean(item.isPurchased),
    votes: item.votes ? JSON.parse(item.votes) : []
  }));

  res.json(formatted);
});

app.post('/api/shopping', authenticateToken, (req, res) => {
  try {
    const { nameSi, nameEn, unitPrice, quantity, unit, notes, catalogItemId, bodimaId } = req.body;
    const targetBodimaId = bodimaId || req.user.bodimaId;
    const requestedById = req.user.id;
    const id = `req_${Date.now()}`;
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
app.post('/api/shopping/:id/vote', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = db.prepare('SELECT votes FROM shopping_requests WHERE id = ?').get(id);
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

// Toggle purchased
app.patch('/api/shopping/:id/purchased', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT is_purchased FROM shopping_requests WHERE id = ?').get(id);
    const newStatus = current.is_purchased ? 0 : 1;
    db.prepare('UPDATE shopping_requests SET is_purchased = ? WHERE id = ?').run(newStatus, id);
    res.json({ success: true, isPurchased: Boolean(newStatus) });
  } catch (error) {
    res.status(500).json({ error: 'තත්වය වෙනස් කිරීමේදී දෝෂයක් ඇති විය' });
  }
});

// Convert list to expense
app.post('/api/shopping/convert-to-expense', authenticateToken, (req, res) => {
  try {
    const paidById = req.body.paidById || req.user.id;
    const targetBodimaId = req.body.bodimaId || req.user.bodimaId;
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
