const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { upload, uploadBufferToCloudinary, createPresignedR2Upload, uploadBufferToR2, r2Configured } = require('../utils/upload');

const router = express.Router();

function serialize(row) {
  return {
    ...row,
    tags: safeParse(row.tags, []),
    ratings: safeParse(row.ratings, []),
    reports: safeParse(row.reports, []),
    is_approved: !!row.is_approved,
  };
}

function safeParse(val, fallback) {
  if (val == null) return fallback;
  if (Array.isArray(val) || typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

// GET /api/resources
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { course, semester, type, includeUnapproved } = req.query;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const isAdmin = req.user && ['admin', 'moderator'].includes(req.user.role);

    const where = [];
    const params = { limit };

    if (!(includeUnapproved === 'true' && isAdmin)) {
      where.push('is_approved = TRUE');
    }
    if (course && course !== 'All Courses') { where.push('course = :course'); params.course = course; }
    if (semester) { where.push('semester = :semester'); params.semester = Number(semester); }
    if (type && type !== 'All') { where.push('type = :type'); params.type = type; }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM resources ${whereSql} ORDER BY created_at DESC LIMIT :limit`,
      params
    );
    res.json(rows.map(serialize));
  } catch (err) {
    console.error('[resources] list error:', err);
    res.status(500).json({ error: 'Failed to load resources.' });
  }
});

// GET /api/resources/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM resources WHERE uploader_id = :uid ORDER BY created_at DESC',
      { uid: req.user.id }
    );
    res.json(rows.map(serialize));
  } catch (err) {
    console.error('[resources] my resources error:', err);
    res.status(500).json({ error: 'Failed to load your resources.' });
  }
});

// POST /api/resources/presign-upload — direct-to-R2 PDF upload
router.post('/presign-upload', requireAuth, async (req, res) => {
  try {
    const { filename, mimeType, folder } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename is required.' });
    const result = await createPresignedR2Upload({ filename, mimeType, folder: folder || 'resources' });
    res.json(result);
  } catch (err) {
    console.error('[resources] presign error:', err);
    res.status(500).json({ error: err.message || 'R2 not configured. Falling back to multi-hop upload.' });
  }
});

// POST /api/resources/upload — multi-hop upload (images → Cloudinary, PDFs → R2)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const folder = req.query.folder || 'resources';

    let url;
    if (req.file.mimetype === 'application/pdf') {
      if (!r2Configured) return res.status(500).json({ error: 'Storage not configured for PDF uploads.' });
      url = await uploadBufferToR2(req.file.buffer, req.file.mimetype, folder, req.file.originalname);
    } else if (req.file.mimetype.startsWith('image/')) {
      url = await uploadBufferToCloudinary(req.file.buffer, folder);
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    res.json({ url });
  } catch (err) {
    console.error('[resources] upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});

// POST /api/resources
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, type, course, semester, subCategory,
      subjectCode, tags, link, directDownloadLink, uploader,
    } = req.body;

    if (!title || !type || !course) {
      return res.status(400).json({ error: 'title, type and course are required.' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO resources
        (id, title, description, type, course, semester, sub_category, subject_code, tags,
         link, direct_download_link, uploader, uploader_id, uploader_role,
         is_approved, ratings, reports, created_at)
       VALUES
        (:id, :title, :description, :type, :course, :semester, :subCategory, :subjectCode, :tags::jsonb,
         :link, :directDownloadLink, :uploader, :uploaderId, :uploaderRole,
         :isApproved, '[]'::jsonb, '[]'::jsonb, NOW())`,
      {
        id,
        title,
        description: description || '',
        type,
        course,
        semester: Number(semester) || 0,
        subCategory: subCategory || '',
        subjectCode: subjectCode || '',
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        link: link || '',
        directDownloadLink: directDownloadLink || '',
        uploader: uploader || req.user.display_name,
        uploaderId: req.user.id,
        uploaderRole: req.user.role,
        isApproved: req.user.role === 'admin' || req.user.role === 'moderator',
      }
    );

    await pool.query('UPDATE users SET resource_count = resource_count + 1 WHERE id = :id', { id: req.user.id });

    res.status(201).json({ id });
  } catch (err) {
    console.error('[resources] create error:', err);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

// PATCH /api/resources/:id/approve — admin/moderator
router.patch('/:id/approve', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    await pool.query('UPDATE resources SET is_approved = TRUE WHERE id = :id', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('[resources] approve error:', err);
    res.status(500).json({ error: 'Failed to approve resource.' });
  }
});

// PATCH /api/resources/:id/rate
router.patch('/:id/rate', requireAuth, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5.' });

    const [rows] = await pool.query('SELECT ratings FROM resources WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Resource not found.' });

    const ratings = safeParse(rows[0].ratings, []);
    ratings.push(Number(rating));
    await pool.query('UPDATE resources SET ratings = :ratings::jsonb WHERE id = :id', {
      ratings: JSON.stringify(ratings),
      id: req.params.id,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[resources] rate error:', err);
    res.status(500).json({ error: 'Failed to rate resource.' });
  }
});

// PATCH /api/resources/:id/report
router.patch('/:id/report', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const [rows] = await pool.query('SELECT reports FROM resources WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Resource not found.' });

    const reports = safeParse(rows[0].reports, []);
    reports.push({ reason: reason || 'No reason provided', date: new Date().toISOString() });
    await pool.query('UPDATE resources SET reports = :reports::jsonb WHERE id = :id', {
      reports: JSON.stringify(reports),
      id: req.params.id,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[resources] report error:', err);
    res.status(500).json({ error: 'Failed to report resource.' });
  }
});

// PATCH /api/resources/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = :id', { id: req.params.id });
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'Resource not found.' });

    const isOwner = existing.uploader_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to edit this resource.' });

    const allowed = ['title', 'description', 'type', 'course', 'semester', 'sub_category', 'subject_code',
      'tags', 'link', 'direct_download_link', 'file_url', 'thumbnail_url', 'is_approved'];
    const fields = [];
    const params = { id: req.params.id };

    const jsonbColumns = ['tags'];
    for (const [key, value] of Object.entries(req.body)) {
      if (!allowed.includes(key)) continue;
      const column = key;
      const cast = jsonbColumns.includes(column) ? '::jsonb' : '';
      fields.push(`${column} = :${column}${cast}`);
      params[column] = Array.isArray(value) ? JSON.stringify(value) : value;
    }

    if (fields.length === 0) return res.json({ success: true });

    await pool.query(`UPDATE resources SET ${fields.join(', ')} WHERE id = :id`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[resources] update error:', err);
    res.status(500).json({ error: 'Failed to update resource.' });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT uploader_id FROM resources WHERE id = :id', { id: req.params.id });
    if (!rows[0]) return res.status(404).json({ error: 'Resource not found.' });

    const isOwner = rows[0].uploader_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this resource.' });

    await pool.query('DELETE FROM resources WHERE id = :id', { id: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('[resources] delete error:', err);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

module.exports = router;
