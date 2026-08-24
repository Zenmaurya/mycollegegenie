const express = require('express');
const pool = require('../config/db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function safeArr(val) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return []; }
}

router.get('/foryou', optionalAuth, async (req, res) => {
  try {
    const tab = req.query.tab || 'foryou';
    const searches = (req.query.searches ? String(req.query.searches).split(',') : []).filter(Boolean);

    const [posts] = await pool.query(
      `SELECT p.id, p.title, p.content, p.course, p.topic, p.created_at, p.upvotes,
              u.display_name AS author_name,
              (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS comment_count
       FROM forum_posts p LEFT JOIN users u ON u.id = p.author_id
       ORDER BY p.created_at DESC LIMIT 100`
    );
    const [news] = await pool.query(
      `SELECT id, title, summary, category, college, date, venue, eligibility, image_url, created_at
       FROM news WHERE is_approved = TRUE AND category = 'News' ORDER BY created_at DESC LIMIT 100`
    );
    const [events] = await pool.query(
      `SELECT id, title, summary, category, college, date, venue, eligibility, image_url, created_at
       FROM news WHERE is_approved = TRUE AND category = 'Event' ORDER BY created_at DESC LIMIT 100`
    );
    const [interactions] = await pool.query(
      `SELECT item_type, item_id, SUM(CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END) AS views,
              SUM(CASE WHEN interaction_type = 'click' THEN 1 ELSE 0 END) AS clicks,
              SUM(CASE WHEN interaction_type = 'upvote' THEN 1 ELSE 0 END) AS upvote_events
       FROM feed_interactions GROUP BY item_type, item_id`
    );

    const scoreMap = new Map();
    interactions.forEach((i) => {
      scoreMap.set(`${i.item_type}:${i.item_id}`, Number(i.views) + Number(i.clicks) * 3 + Number(i.upvote_events) * 5);
    });

    const items = [
      ...posts.map((p) => ({
        id: p.id,
        feedType: 'forum_post',
        title: p.title,
        content: p.content,
        course: p.course,
        topic: p.topic,
        author_name: p.author_name,
        upvotes: safeArr(p.upvotes),
        comment_count: p.comment_count,
        created_at: p.created_at,
      })),
      ...news.map((n) => ({ id: n.id, feedType: 'news', ...n })),
      ...events.map((e) => ({ id: e.id, feedType: 'event', ...e })),
    ].map((item) => {
      const interactionScore = scoreMap.get(`${item.feedType}:${item.id}`) || 0;
      const recencyScore = new Date(item.created_at).getTime() / 1e10; // small tiebreaker
      let searchBoost = 0;
      if (searches.length) {
        const haystack = `${item.title || ''} ${item.content || item.summary || ''} ${item.course || ''} ${item.topic || ''}`.toLowerCase();
        searchBoost = searches.some((s) => haystack.includes(s.toLowerCase())) ? 10 : 0;
      }
      return { ...item, feedScore: interactionScore + recencyScore + searchBoost };
    });

    let sorted;
    if (tab === 'recent') {
      sorted = items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (tab === 'trending') {
      sorted = items.sort((a, b) => b.feedScore - a.feedScore);
    } else {
      sorted = items.sort((a, b) => b.feedScore - a.feedScore);
    }

    res.json(sorted.slice(0, 60));
  } catch (err) {
    console.error('[feed] foryou error:', err);
    res.status(500).json({ error: 'Failed to load feed.' });
  }
});

// POST /api/feed/interact
router.post('/interact', optionalAuth, async (req, res) => {
  try {
    const { itemType, itemId, interactionType } = req.body;
    if (!itemType || !itemId || !interactionType) {
      return res.status(400).json({ error: 'itemType, itemId and interactionType are required.' });
    }
    await pool.query(
      `INSERT INTO feed_interactions (item_type, item_id, interaction_type, user_id, created_at)
       VALUES (:itemType, :itemId, :interactionType, :userId, NOW())`,
      { itemType, itemId, interactionType, userId: req.user ? req.user.id : null }
    );
    res.status(204).end();
  } catch (err) {
    console.error('[feed] interact error:', err);
    res.status(500).json({ error: 'Failed to record interaction.' });
  }
});

module.exports = router;
