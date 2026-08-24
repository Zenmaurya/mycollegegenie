const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const pool = require('../config/db');

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const jwksUri = supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : null;

const jwks = jwksUri
  ? jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

function getSigningKey(kid) {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey ? key.getPublicKey() : key.publicKey || key.rsaPublicKey);
    });
  });
}

async function decodeSupabaseToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) throw new Error('Malformed token.');
  const { alg, kid } = decoded.header;

  if (alg && alg !== 'HS256') {
    if (!jwks) throw new Error('SUPABASE_URL is not configured on the backend (needed to fetch JWKS).');
    const publicKey = await getSigningKey(kid);
    return jwt.verify(token, publicKey, { algorithms: [alg] });
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not configured on the backend.');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Missing or invalid Authorization header.' });

    const payload = await decodeSupabaseToken(token);
    const uid = payload.sub;
    const email = payload.email || (payload.user_metadata && payload.user_metadata.email) || null;

    if (!uid) return res.status(401).json({ error: 'Invalid token: missing subject.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: uid });

    let user = rows[0];
    if (!user) {
      const displayName =
        (payload.user_metadata && (payload.user_metadata.full_name || payload.user_metadata.name)) ||
        (email ? email.split('@')[0] : 'Student');
      const photoUrl = (payload.user_metadata && payload.user_metadata.avatar_url) || '';

      await pool.query(
        `INSERT INTO users (id, email, display_name, photo_url, role, created_at)
         VALUES (:id, :email, :displayName, :photoUrl, 'user', NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        { id: uid, email, displayName, photoUrl }
      );
      const [freshRows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: uid });
      user = freshRows[0];
    }

    req.authUser = { id: uid, email };
    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}

async function optionalAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const payload = await decodeSupabaseToken(token);
    const uid = payload.sub;
    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: uid });
    req.authUser = { id: uid, email: payload.email || null };
    req.user = rows[0] || null;
  } catch (err) {
    // Ignore — treat as anonymous
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };