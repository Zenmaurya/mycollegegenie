const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function serializeUser(row) {
  if (!row) return null;
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    role: row.role,
    is_verified: !!row.is_verified,
    createdAt: row.created_at,
    college: row.college,
    course: row.course,
    exchange_count: row.exchange_count,
    resource_count: row.resource_count,
    forum_count: row.forum_count,
  };
}

/**
 * POST /api/users/sync — Supabase Auth webhook target.
 * Configure a Database Webhook on `auth.users` (INSERT) pointing here, with the
 * shared secret in `SUPABASE_WEBHOOK_SECRET` sent as `x-webhook-secret`.
 */
router.post('/sync', async (req, res) => {
  try {
    const secret = req.headers['x-webhook-secret'];
    if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret.' });
    }
    const record = req.body.record || req.body;
    const id = record.id;
    const email = record.email;
    const meta = record.raw_user_meta_data || record.user_metadata || {};
    const displayName = meta.full_name || meta.name || (email ? email.split('@')[0] : 'Student');
    const photoUrl = meta.avatar_url || '';

    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url, role, created_at)
       VALUES (:id, :email, :displayName, :photoUrl, 'user', NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      { id, email, displayName, photoUrl }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[users] sync error:', err);
    res.status(500).json({ error: 'Failed to sync user.' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  res.json(serializeUser(req.user));
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { displayName, college, course, batchYear } = req.body;
    const fields = [];
    const params = { id: req.user.id };

    if (displayName !== undefined) { fields.push('display_name = :displayName'); params.displayName = displayName; }
    if (college !== undefined) { fields.push('college = :college'); params.college = college; }
    if (course !== undefined) { fields.push('course = :course'); params.course = course; }
    if (batchYear !== undefined) { fields.push('batch_year = :batchYear'); params.batchYear = batchYear; }

    if (fields.length > 0) {
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = :id`, params);
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
    res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('[users] update me error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PATCH /api/users/me/avatar
router.patch('/me/avatar', requireAuth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'photoUrl is required.' });
    await pool.query('UPDATE users SET photo_url = :photoUrl WHERE id = :id', { photoUrl, id: req.user.id });
    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('[users] update avatar error:', err);
    res.status(500).json({ error: 'Failed to update avatar.' });
  }
});

// GET /api/users/public/:id — safe public profile subset
router.get('/public/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, display_name, photo_url, role, is_verified, college, course, created_at,
              exchange_count, resource_count, forum_count
       FROM users WHERE id = :id LIMIT 1`,
      { id: req.params.id }
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('[users] public profile error:', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// GET /api/users — admin only, paginated
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;
    const [rows] = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset',
      { limit, offset }
    );
    res.json(rows.map(serializeUser));
  } catch (err) {
    console.error('[users] list error:', err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin', 'faculty'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    await pool.query('UPDATE users SET role = :role WHERE id = :id', { role, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('[users] update role error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

module.exports = router;
