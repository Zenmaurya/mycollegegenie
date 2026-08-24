const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/campus-exchange
router.get('/', async (req, res) => {
  try {
    const { type, college, q } = req.query;
    const where = ['e.is_active = TRUE'];
    const params = {};

    if (type && type !== 'All' && type !== 'all') { where.push('e.type = :type'); params.type = type; }
    if (college && college !== 'All Campuses' && college !== 'all') { where.push('e.college = :college'); params.college = college; }
    if (q) { where.push('(e.title LIKE :q OR e.description LIKE :q)'); params.q = `%${q}%`; }

    const [rows] = await pool.query(
      `SELECT e.*, u.display_name AS seller_name, u.photo_url AS seller_avatar
       FROM campus_exchange e
       LEFT JOIN users u ON u.id = e.author_id
       WHERE ${where.join(' AND ')}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json(rows.map((r) => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error('[exchange] list error:', err);
    res.status(500).json({ error: 'Failed to load listings.' });
  }
});

// GET /api/campus-exchange/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM campus_exchange WHERE author_id = :uid ORDER BY created_at DESC',
      { uid: req.user.id }
    );
    res.json(rows.map((r) => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error('[exchange] my listings error:', err);
    res.status(500).json({ error: 'Failed to load your listings.' });
  }
});

// POST /api/campus-exchange
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, price, original_price, type, category,
      college, image_url, exchange_for, contact_phone, contact_instagram,
    } = req.body;

    if (!title || !type || !category) {
      return res.status(400).json({ error: 'title, type and category are required.' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO campus_exchange
        (id, title, description, price, original_price, type, category, college,
         image_url, exchange_for, contact_phone, contact_instagram, author_id,
         is_active, created_at)
       VALUES
        (:id, :title, :description, :price, :originalPrice, :type, :category, :college,
         :imageUrl, :exchangeFor, :contactPhone, :contactInstagram, :authorId,
         TRUE, NOW())`,
      {
        id,
        title,
        description: description || '',
        price: price || 0,
        originalPrice: original_price || null,
        type,
        category,
        college: college || '',
        imageUrl: image_url || '',
        exchangeFor: exchange_for || '',
        contactPhone: contact_phone || '',
        contactInstagram: contact_instagram || '',
        authorId: req.user.id,
      }
    );

    await pool.query('UPDATE users SET exchange_count = exchange_count + 1 WHERE id = :id', { id: req.user.id });

    res.status(201).json({ id });
  } catch (err) {
    console.error('[exchange] create error:', err);
    res.status(500).json({ error: 'Failed to create listing.' });
  }
});

// DELETE /api/campus-exchange/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM campus_exchange WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found.' });

    const isOwner = rows[0].author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this listing.' });

    await pool.query('DELETE FROM campus_exchange WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[exchange] delete error:', err);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

module.exports = router;
