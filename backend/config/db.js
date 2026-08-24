const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    });

function namedToPositional(sql, params = {}) {
  const values = [];
  const nameToIndex = new Map();

  const text = sql.replace(/(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name) => {
    if (!(name in params)) {
      throw new Error(`Missing value for named parameter :${name}`);
    }
    if (!nameToIndex.has(name)) {
      values.push(params[name]);
      nameToIndex.set(name, values.length);
    }
    return `$${nameToIndex.get(name)}`;
  });

  return { text, values };
}

async function query(sql, params = {}) {
  const { text, values } = namedToPositional(sql, params);
  const result = await pool.query(text, values);
  return [result.rows];
}

pool
  .connect()
  .then((client) => {
    console.log(' [db] PostgreSQL (Supabase) connected');
    client.release();
  })
  .catch((err) => {
    console.error(' [db] PostgreSQL connection failed:', err.message);
  });

module.exports = { query, pool };
