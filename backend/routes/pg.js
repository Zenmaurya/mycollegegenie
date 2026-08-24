const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function serialize(row) {
  let images = [];
  try { images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []); } catch { images = []; }
  return { ...row, images };
}

// GET /api/pg
router.get('/', async (req, res) => {
  try {
    const { college, gender } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 300);
    const where = [];
    const params = { limit };

    if (college) { where.push('college = :college'); params.college = college; }
    if (gender && gender !== 'Any') { where.push('gender = :gender'); params.gender = gender; }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM pg_listings ${whereSql} ORDER BY created_at DESC LIMIT :limit`,
      params
    );
    res.json(rows.map(serialize));
  } catch (err) {
    console.error('[pg] list error:', err);
    res.status(500).json({ error: 'Failed to load PG listings.' });
  }
});

// POST /api/pg
router.post('/', requireAuth, async (req, res) => {
  try {
    const { college, location, budget, gender, description, socialLink, images } = req.body;
    if (!college || !location || !budget) {
      return res.status(400).json({ error: 'college, location and budget are required.' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO pg_listings
        (id, college, location, budget, gender, description, social_link, images,
         author_id, author_name, author_photo, created_at)
       VALUES
        (:id, :college, :location, :budget, :gender, :description, :socialLink, :images::jsonb,
         :authorId, :authorName, :authorPhoto, NOW())`,
      {
        id,
        college,
        location,
        budget,
        gender: gender || 'Any',
        description: description || '',
        socialLink: socialLink || '',
        images: JSON.stringify(Array.isArray(images) ? images : []),
        authorId: req.user.id,
        authorName: req.user.display_name,
        authorPhoto: req.user.photo_url || '',
      }
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('[pg] create error:', err);
    res.status(500).json({ error: 'Failed to create listing.' });
  }
});

// PATCH /api/pg/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM pg_listings WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found.' });

    const isOwner = rows[0].author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to edit this listing.' });

    const allowed = ['college', 'location', 'budget', 'gender', 'description', 'social_link', 'images'];
    const jsonbColumns = ['images'];
    const fields = [];
    const params = { id: req.params.id };

    for (const [key, value] of Object.entries(req.body)) {
      const column = key === 'socialLink' ? 'social_link' : key;
      if (!allowed.includes(column)) continue;
      const cast = jsonbColumns.includes(column) ? '::jsonb' : '';
      fields.push(`${column} = :${column}${cast}`);
      params[column] = Array.isArray(value) ? JSON.stringify(value) : value;
    }

    if (fields.length === 0) return res.json({ success: true });
    await pool.query(`UPDATE pg_listings SET ${fields.join(', ')} WHERE id = :id`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[pg] update error:', err);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

// DELETE /api/pg/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM pg_listings WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found.' });

    const isOwner = rows[0].author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this listing.' });

    await pool.query('DELETE FROM pg_listings WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[pg] delete error:', err);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

module.exports = router;
