const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { upload, uploadBufferToCloudinary } = require('../utils/upload');

const router = express.Router();

// GET /api/news
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, college, includeUnapproved } = req.query;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const isStaff = req.user && ['admin', 'moderator'].includes(req.user.role);

    const where = [];
    const params = { limit };

    if (!(includeUnapproved === 'true' && isStaff)) where.push('is_approved = TRUE');
    if (category) { where.push('category = :category'); params.category = category; }
    if (college) { where.push('college = :college'); params.college = college; }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT n.*, u.display_name AS submitted_by_name
       FROM news n
       LEFT JOIN users u ON u.id = n.submitted_by_id
       ${whereSql}
       ORDER BY n.created_at DESC LIMIT :limit`,
      params
    );
    res.json(rows.map((r) => ({ ...r, is_approved: !!r.is_approved })));
  } catch (err) {
    console.error('[news] list error:', err);
    res.status(500).json({ error: 'Failed to load news.' });
  }
});

// POST /api/news/upload-image
router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });
    const url = await uploadBufferToCloudinary(req.file.buffer, 'news');
    res.json({ url });
  } catch (err) {
    console.error('[news] upload-image error:', err);
    res.status(500).json({ error: 'Image upload failed.' });
  }
});

// POST /api/news
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, summary, category, date, college, url,
      image_url, venue, eligibility, description, is_approved,
    } = req.body;

    if (!title || !category) return res.status(400).json({ error: 'title and category are required.' });

    const id = uuidv4();
    const isStaff = ['admin', 'moderator'].includes(req.user.role);

    await pool.query(
      `INSERT INTO news
        (id, title, summary, category, date, college, url, image_url, venue,
         eligibility, description, is_approved, submitted_by_id, created_at)
       VALUES
        (:id, :title, :summary, :category, :date, :college, :url, :imageUrl, :venue,
         :eligibility, :description, :isApproved, :submittedById, NOW())`,
      {
        id,
        title,
        summary: summary || '',
        category,
        date: date || null,
        college: college || '',
        url: url || '',
        imageUrl: image_url || '',
        venue: venue || '',
        eligibility: eligibility || 'All',
        description: description || summary || '',
        isApproved: isStaff ? is_approved !== false : false,
        submittedById: req.user.id,
      }
    );
    res.status(201).json({ id, message: isStaff ? 'Published.' : 'Submitted for review.' });
  } catch (err) {
    console.error('[news] create error:', err);
    res.status(500).json({ error: 'Failed to submit news/event.' });
  }
});

// PATCH /api/news/:id — includes approve (is_approved: true) from admin panel
router.patch('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const allowed = ['title', 'summary', 'category', 'date', 'college', 'url',
      'image_url', 'venue', 'eligibility', 'description', 'is_approved'];
    const fields = [];
    const params = { id: req.params.id };

    for (const [key, value] of Object.entries(req.body)) {
      if (!allowed.includes(key)) continue;
      fields.push(`${key} = :${key}`);
      params[key] = value;
    }
    if (fields.length === 0) return res.json({ success: true });

    await pool.query(`UPDATE news SET ${fields.join(', ')} WHERE id = :id`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[news] update error:', err);
    res.status(500).json({ error: 'Failed to update news/event.' });
  }
});

// DELETE /api/news/:id
router.delete('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[news] delete error:', err);
    res.status(500).json({ error: 'Failed to delete news/event.' });
  }
});

module.exports = router;
