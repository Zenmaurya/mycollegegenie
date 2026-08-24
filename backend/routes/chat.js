const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const CONTACT_PATTERNS = [
  /\b\d{10}\b/, // 10-digit phone numbers
  /\+?\d[\d\s-]{8,}\d/, // loosely formatted phone numbers
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // emails
  /\b(instagram|insta|whatsapp|telegram|snapchat)\b/i,
  /@[a-zA-Z0-9_.]{3,}/, // @handles
];

function containsContactInfo(text) {
  return CONTACT_PATTERNS.some((re) => re.test(text));
}

// GET /api/chat/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*,
              CASE WHEN s.buyer_id = :uid THEN sellerU.display_name ELSE buyerU.display_name END AS other_user_name,
              CASE WHEN s.buyer_id = :uid THEN sellerU.photo_url ELSE buyerU.photo_url END AS other_user_avatar,
              (SELECT content FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time
       FROM chat_sessions s
       LEFT JOIN users buyerU ON buyerU.id = s.buyer_id
       LEFT JOIN users sellerU ON sellerU.id = s.seller_id
       WHERE s.buyer_id = :uid OR s.seller_id = :uid
       ORDER BY last_message_time DESC`,
      { uid: req.user.id }
    );
    res.json(rows);
  } catch (err) {
    console.error('[chat] list sessions error:', err);
    res.status(500).json({ error: 'Failed to load chats.' });
  }
});

// POST /api/chat/sessions
router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { listing_type, listing_id, seller_id } = req.body;
    if (!listing_type || !listing_id || !seller_id) {
      return res.status(400).json({ error: 'listing_type, listing_id and seller_id are required.' });
    }
    if (seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot start a chat with yourself.' });
    }

    const [existing] = await pool.query(
      `SELECT id FROM chat_sessions
       WHERE listing_type = :type AND listing_id = :listingId AND buyer_id = :buyerId AND seller_id = :sellerId
       LIMIT 1`,
      { type: listing_type, listingId: listing_id, buyerId: req.user.id, sellerId: seller_id }
    );
    if (existing[0]) return res.json({ sessionId: existing[0].id });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO chat_sessions (id, listing_type, listing_id, buyer_id, seller_id, status, created_at)
       VALUES (:id, :type, :listingId, :buyerId, :sellerId, 'anonymous', NOW())`,
      { id, type: listing_type, listingId: listing_id, buyerId: req.user.id, sellerId: seller_id }
    );
    res.status(201).json({ sessionId: id });
  } catch (err) {
    console.error('[chat] create session error:', err);
    res.status(500).json({ error: 'Failed to start chat.' });
  }
});

// GET /api/chat/:sessionId/messages
router.get('/:sessionId/messages', requireAuth, async (req, res) => {
  try {
    const [sessions] = await pool.query('SELECT * FROM chat_sessions WHERE id = :id', { id: req.params.sessionId });
    const session = sessions[0];
    if (!session) return res.status(404).json({ error: 'Chat not found.' });
    if (session.buyer_id !== req.user.id && session.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this chat.' });
    }

    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = :id ORDER BY created_at ASC',
      { id: req.params.sessionId }
    );
    res.json({ status: session.status, messages });
  } catch (err) {
    console.error('[chat] get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// POST /api/chat/:sessionId/messages
router.post('/:sessionId/messages', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'content is required.' });

    const [sessions] = await pool.query('SELECT * FROM chat_sessions WHERE id = :id', { id: req.params.sessionId });
    const session = sessions[0];
    if (!session) return res.status(404).json({ error: 'Chat not found.' });
    if (session.buyer_id !== req.user.id && session.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat.' });
    }

    if (session.status === 'anonymous' && containsContactInfo(content)) {
      return res.status(400).json({
        error: 'Contact sharing is disabled until both people unlock this chat. Please remove phone numbers, emails or social handles.',
      });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, session_id, sender_id, content, is_system, created_at)
       VALUES (:id, :sessionId, :senderId, :content, FALSE, NOW())`,
      { id, sessionId: req.params.sessionId, senderId: req.user.id, content }
    );
    res.status(201).json({ success: true, messageId: id });
  } catch (err) {
    console.error('[chat] send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// POST /api/chat/:sessionId/unlock
router.post('/:sessionId/unlock', requireAuth, async (req, res) => {
  try {
    const [sessions] = await pool.query('SELECT * FROM chat_sessions WHERE id = :id', { id: req.params.sessionId });
    const session = sessions[0];
    if (!session) return res.status(404).json({ error: 'Chat not found.' });
    if (session.buyer_id !== req.user.id && session.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to unlock this chat.' });
    }

    await pool.query("UPDATE chat_sessions SET status = 'unlocked' WHERE id = :id", { id: req.params.sessionId });
    await pool.query(
      `INSERT INTO chat_messages (id, session_id, sender_id, content, is_system, created_at)
       VALUES (:id, :sessionId, NULL, 'Chat unlocked — contact details can now be shared.', TRUE, NOW())`,
      { id: uuidv4(), sessionId: req.params.sessionId }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[chat] unlock error:', err);
    res.status(500).json({ error: 'Failed to unlock chat.' });
  }
});

module.exports = router;
