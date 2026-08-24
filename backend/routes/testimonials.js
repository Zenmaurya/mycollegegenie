const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('[testimonials] list error:', err);
    res.status(500).json({ error: 'Failed to load testimonials.' });
  }
});

// POST /api/testimonials
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, handle, image, text } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'name and text are required.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO testimonials (id, name, handle, image, text, created_at)
       VALUES (:id, :name, :handle, :image, :text, NOW())`,
      { id, name, handle: handle || '', image: image || '', text }
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('[testimonials] create error:', err);
    res.status(500).json({ error: 'Failed to add testimonial.' });
  }
});

// PATCH /api/testimonials/:id — admin only
router.patch('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const allowed = ['name', 'handle', 'image', 'text'];
    const fields = [];
    const params = { id: req.params.id };

    for (const [key, value] of Object.entries(req.body)) {
      if (!allowed.includes(key)) continue;
      fields.push(`${key} = :${key}`);
      params[key] = value;
    }
    if (fields.length === 0) return res.json({ success: true });

    await pool.query(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = :id`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[testimonials] update error:', err);
    res.status(500).json({ error: 'Failed to update testimonial.' });
  }
});

// DELETE /api/testimonials/:id — admin only
router.delete('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[testimonials] delete error:', err);
    res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
});

module.exports = router;
