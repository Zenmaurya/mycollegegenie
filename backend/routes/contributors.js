const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function serialize(row) {
  let badges = [];
  try { badges = typeof row.badges === 'string' ? JSON.parse(row.badges || '[]') : (row.badges || []); } catch { badges = []; }
  return { ...row, badges, is_approved: !!row.is_approved };
}

// GET /api/contributors — public, approved only
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM contributors WHERE is_approved = TRUE ORDER BY category, contributions DESC'
    );
    res.json(rows.map(serialize));
  } catch (err) {
    console.error('[contributors] list error:', err);
    res.status(500).json({ error: 'Failed to load contributors.' });
  }
});

// GET /api/contributors/all — admin only
router.get('/all', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contributors ORDER BY created_at DESC');
    res.json(rows.map(serialize));
  } catch (err) {
    console.error('[contributors] list all error:', err);
    res.status(500).json({ error: 'Failed to load contributors.' });
  }
});

// POST /api/contributors — admin only
router.post('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const {
      category, name, role, image, bio, contributions, badges,
      social_linkedin, social_instagram, social_github, is_approved,
    } = req.body;

    if (!category || !name) return res.status(400).json({ error: 'category and name are required.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO contributors
        (id, category, name, role, image, bio, contributions, badges,
         social_linkedin, social_instagram, social_github, is_approved, created_at)
       VALUES
        (:id, :category, :name, :role, :image, :bio, :contributions, :badges::jsonb,
         :socialLinkedin, :socialInstagram, :socialGithub, :isApproved, NOW())`,
      {
        id,
        category,
        name,
        role: role || '',
        image: image || '',
        bio: bio || '',
        contributions: contributions || 0,
        badges: JSON.stringify(Array.isArray(badges) ? badges : []),
        socialLinkedin: social_linkedin || '',
        socialInstagram: social_instagram || '',
        socialGithub: social_github || '',
        isApproved: is_approved !== false,
      }
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('[contributors] create error:', err);
    res.status(500).json({ error: 'Failed to add contributor.' });
  }
});

// PATCH /api/contributors/:id — admin only
router.patch('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const allowed = ['category', 'name', 'role', 'image', 'bio', 'contributions', 'badges',
      'social_linkedin', 'social_instagram', 'social_github', 'is_approved'];
    const fields = [];
    const params = { id: req.params.id };

    for (const [key, value] of Object.entries(req.body)) {
      if (!allowed.includes(key)) continue;
      const cast = key === 'badges' ? '::jsonb' : '';
      fields.push(`${key} = :${key}${cast}`);
      if (key === 'badges') params[key] = JSON.stringify(Array.isArray(value) ? value : []);
      else params[key] = value;
    }
    if (fields.length === 0) return res.json({ success: true });

    await pool.query(`UPDATE contributors SET ${fields.join(', ')} WHERE id = :id`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[contributors] update error:', err);
    res.status(500).json({ error: 'Failed to update contributor.' });
  }
});

// DELETE /api/contributors/:id — admin only
router.delete('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM contributors WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[contributors] delete error:', err);
    res.status(500).json({ error: 'Failed to delete contributor.' });
  }
});

module.exports = router;
