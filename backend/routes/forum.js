const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function safeArr(val) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return []; }
}

function toggleVote(existingArr, oppositeArr, userId) {
  const upSet = new Set(safeArr(existingArr));
  const downSet = new Set(safeArr(oppositeArr));
  if (upSet.has(userId)) {
    upSet.delete(userId);
  } else {
    upSet.add(userId);
    downSet.delete(userId);
  }
  return { primary: Array.from(upSet), opposite: Array.from(downSet) };
}

// GET /api/forum/posts
router.get('/posts', async (req, res) => {
  try {
    const { course, topic, sort } = req.query;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const where = [];
    const params = { limit };

    if (course && course !== 'All') { where.push('p.course = :course'); params.course = course; }
    if (topic && topic !== 'All') { where.push('p.topic = :topic'); params.topic = topic; }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let orderSql = 'p.created_at DESC'; // 'new'
    if (sort === 'top') orderSql = '(jsonb_array_length(p.upvotes) - jsonb_array_length(p.downvotes)) DESC, p.created_at DESC';
    if (sort === 'hot') orderSql = "(jsonb_array_length(p.upvotes) + (SELECT COUNT(*) FROM forum_comments c2 WHERE c2.post_id = p.id)) DESC, p.created_at DESC";

    const [rows] = await pool.query(
      `SELECT p.*, u.display_name AS author_name,
              (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS comment_count
       FROM forum_posts p
       LEFT JOIN users u ON u.id = p.author_id
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT :limit`,
      params
    );
    res.json(rows.map((r) => ({ ...r, upvotes: safeArr(r.upvotes), downvotes: safeArr(r.downvotes) })));
  } catch (err) {
    console.error('[forum] list posts error:', err);
    res.status(500).json({ error: 'Failed to load posts.' });
  }
});

// GET /api/forum/posts/:id
router.get('/posts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.display_name AS author_name,
              (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS comment_count
       FROM forum_posts p
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.id = :id`,
      { id: req.params.id }
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    const p = rows[0];
    res.json({ ...p, upvotes: safeArr(p.upvotes), downvotes: safeArr(p.downvotes) });
  } catch (err) {
    console.error('[forum] get post error:', err);
    res.status(500).json({ error: 'Failed to load post.' });
  }
});

// POST /api/forum/posts
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { title, content, course, topic } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO forum_posts (id, title, content, author_id, course, topic, upvotes, downvotes, created_at)
       VALUES (:id, :title, :content, :authorId, :course, :topic, '[]'::jsonb, '[]'::jsonb, NOW())`,
      { id, title, content, authorId: req.user.id, course: course || '', topic: topic || '' }
    );
    await pool.query('UPDATE users SET forum_count = forum_count + 1 WHERE id = :id', { id: req.user.id });
    res.status(201).json({ id });
  } catch (err) {
    console.error('[forum] create post error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// DELETE /api/forum/posts/:id
router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM forum_posts WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });

    const isOwner = rows[0].author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this post.' });

    await pool.query('DELETE FROM forum_comments WHERE post_id = :id', { id: req.params.id });
    await pool.query('DELETE FROM forum_posts WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[forum] delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// PATCH /api/forum/posts/:id/vote
router.patch('/posts/:id/vote', requireAuth, async (req, res) => {
  try {
    const { type } = req.body; // 'up' | 'down'
    const [rows] = await pool.query('SELECT upvotes, downvotes FROM forum_posts WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });

    let upvotes = safeArr(rows[0].upvotes);
    let downvotes = safeArr(rows[0].downvotes);

    if (type === 'up') {
      const result = toggleVote(upvotes, downvotes, req.user.id);
      upvotes = result.primary;
      downvotes = result.opposite;
    } else {
      const result = toggleVote(downvotes, upvotes, req.user.id);
      downvotes = result.primary;
      upvotes = result.opposite;
    }

    await pool.query('UPDATE forum_posts SET upvotes = :upvotes::jsonb, downvotes = :downvotes::jsonb WHERE id = :id', {
      upvotes: JSON.stringify(upvotes),
      downvotes: JSON.stringify(downvotes),
      id: req.params.id,
    });
    res.json({ upvotes, downvotes });
  } catch (err) {
    console.error('[forum] vote post error:', err);
    res.status(500).json({ error: 'Failed to vote on post.' });
  }
});

// GET /api/forum/posts/:id/comments
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.display_name AS author_name
       FROM forum_comments c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.post_id = :postId
       ORDER BY c.created_at ASC`,
      { postId: req.params.id }
    );
    res.json(rows.map((r) => ({ ...r, upvotes: safeArr(r.upvotes), downvotes: safeArr(r.downvotes) })));
  } catch (err) {
    console.error('[forum] list comments error:', err);
    res.status(500).json({ error: 'Failed to load comments.' });
  }
});

// POST /api/forum/posts/:id/comments
router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO forum_comments (id, post_id, author_id, content, upvotes, downvotes, created_at)
       VALUES (:id, :postId, :authorId, :content, '[]'::jsonb, '[]'::jsonb, NOW())`,
      { id, postId: req.params.id, authorId: req.user.id, content }
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('[forum] add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// PATCH /api/forum/posts/:postId/comments/:commentId/vote
router.patch('/posts/:postId/comments/:commentId/vote', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const [rows] = await pool.query(
      'SELECT upvotes, downvotes FROM forum_comments WHERE id = :id AND post_id = :postId',
      { id: req.params.commentId, postId: req.params.postId }
    );
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found.' });

    let upvotes = safeArr(rows[0].upvotes);
    let downvotes = safeArr(rows[0].downvotes);

    if (type === 'up') {
      const result = toggleVote(upvotes, downvotes, req.user.id);
      upvotes = result.primary;
      downvotes = result.opposite;
    } else {
      const result = toggleVote(downvotes, upvotes, req.user.id);
      downvotes = result.primary;
      upvotes = result.opposite;
    }

    await pool.query('UPDATE forum_comments SET upvotes = :upvotes::jsonb, downvotes = :downvotes::jsonb WHERE id = :id', {
      upvotes: JSON.stringify(upvotes),
      downvotes: JSON.stringify(downvotes),
      id: req.params.commentId,
    });
    res.json({ upvotes, downvotes });
  } catch (err) {
    console.error('[forum] vote comment error:', err);
    res.status(500).json({ error: 'Failed to vote on comment.' });
  }
});

// DELETE /api/forum/posts/:postId/comments/:commentId
router.delete('/posts/:postId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM forum_comments WHERE id = :id', { id: req.params.commentId });
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found.' });

    const isOwner = rows[0].author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this comment.' });

    await pool.query('DELETE FROM forum_comments WHERE id = :id', { id: req.params.commentId });
    res.status(204).end();
  } catch (err) {
    console.error('[forum] delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

// GET /api/forum/guilds
router.get('/guilds', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM forum_guilds ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('[forum] list guilds error:', err);
    res.status(500).json({ error: 'Failed to load guilds.' });
  }
});

// POST /api/forum/guilds
router.post('/guilds', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO forum_guilds (id, name, description, created_by, created_at)
       VALUES (:id, :name, :description, :createdBy, NOW())`,
      { id, name, description: description || '', createdBy: req.user.id }
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('[forum] create guild error:', err);
    res.status(500).json({ error: 'Failed to create guild.' });
  }
});

module.exports = router;