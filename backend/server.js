require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users');
const resourcesRoutes = require('./routes/resources');
const pgRoutes = require('./routes/pg');
const exchangeRoutes = require('./routes/exchange');
const newsRoutes = require('./routes/news');
const testimonialsRoutes = require('./routes/testimonials');
const contributorsRoutes = require('./routes/contributors');
const forumRoutes = require('./routes/forum');
const chatRoutes = require('./routes/chat');
const feedRoutes = require('./routes/feed');

const app = express();

// CORS 
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));

// Health check 
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mycollegegenie-backend' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/pg', pgRoutes);
app.use('/api/campus-exchange', exchangeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feed', feedRoutes);

// 404 handler 
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler 
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(` MyCollegeGenie backend listening on port ${PORT}`);
});
