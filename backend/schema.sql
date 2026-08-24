CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT,
  display_name   TEXT DEFAULT 'Student',
  photo_url      TEXT,
  role           TEXT DEFAULT 'user' CHECK (role IN ('user','moderator','admin','faculty')),
  is_verified    BOOLEAN DEFAULT FALSE,
  college        TEXT,
  course         TEXT,
  batch_year     INTEGER,
  exchange_count INTEGER DEFAULT 0,
  resource_count INTEGER DEFAULT 0,
  forum_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id                    TEXT PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT,
  type                  TEXT NOT NULL CHECK (type IN ('Note','PYQ','Playlist','Book','Syllabus')),
  course                TEXT,
  semester              INTEGER DEFAULT 0,
  sub_category          TEXT,
  subject_code          TEXT,
  tags                  JSONB DEFAULT '[]',
  link                  TEXT,
  direct_download_link  TEXT,
  file_url              TEXT,
  thumbnail_url         TEXT,
  uploader              TEXT,
  uploader_id           TEXT,
  uploader_role         TEXT,
  is_approved           BOOLEAN DEFAULT FALSE,
  ratings               JSONB DEFAULT '[]',
  reports               JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources (course);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type);
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON resources (uploader_id);

CREATE TABLE IF NOT EXISTS pg_listings (
  id            TEXT PRIMARY KEY,
  college       TEXT,
  location      TEXT,
  budget        TEXT,
  gender        TEXT DEFAULT 'Any' CHECK (gender IN ('Male','Female','Any')),
  description   TEXT,
  images        JSONB DEFAULT '[]',
  social_link   TEXT,
  author_id     TEXT,
  author_name   TEXT,
  author_photo  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pg_college ON pg_listings (college);
CREATE INDEX IF NOT EXISTS idx_pg_author ON pg_listings (author_id);

CREATE TABLE IF NOT EXISTS campus_exchange (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT,
  price              NUMERIC(10,2) DEFAULT 0,
  original_price     NUMERIC(10,2),
  type               TEXT,
  category           TEXT,
  college            TEXT,
  image_url          TEXT,
  exchange_for       TEXT,
  contact_phone      TEXT,
  contact_instagram  TEXT,
  author_id          TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exchange_type ON campus_exchange (type);
CREATE INDEX IF NOT EXISTS idx_exchange_college ON campus_exchange (college);
CREATE INDEX IF NOT EXISTS idx_exchange_author ON campus_exchange (author_id);

CREATE TABLE IF NOT EXISTS news (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  summary          TEXT,
  category         TEXT DEFAULT 'News' CHECK (category IN ('News','Event')),
  date             TEXT,
  college          TEXT,
  url              TEXT,
  image_url        TEXT,
  venue            TEXT,
  eligibility      TEXT,
  description      TEXT,
  is_approved      BOOLEAN DEFAULT FALSE,
  submitted_by_id  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_category ON news (category);
CREATE INDEX IF NOT EXISTS idx_news_college ON news (college);

CREATE TABLE IF NOT EXISTS testimonials (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  handle      TEXT,
  image       TEXT,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributors (
  id                TEXT PRIMARY KEY,
  category          TEXT NOT NULL CHECK (category IN ('core_team','feature_contributor','resource_contributor','wall_of_fame')),
  name              TEXT NOT NULL,
  role              TEXT,
  image             TEXT,
  bio               TEXT,
  contributions     INTEGER DEFAULT 0,
  badges            JSONB DEFAULT '[]',
  social_linkedin   TEXT,
  social_instagram  TEXT,
  social_github     TEXT,
  is_approved       BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  author_id   TEXT,
  course      TEXT,
  topic       TEXT,
  upvotes     JSONB DEFAULT '[]',
  downvotes   JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_course ON forum_posts (course);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts (topic);

CREATE TABLE IF NOT EXISTS forum_comments (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL,
  author_id   TEXT,
  content     TEXT NOT NULL,
  upvotes     JSONB DEFAULT '[]',
  downvotes   JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments (post_id);

CREATE TABLE IF NOT EXISTS forum_guilds (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id           TEXT PRIMARY KEY,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('pg','exchange')),
  listing_id   TEXT NOT NULL,
  buyer_id     TEXT NOT NULL,
  seller_id    TEXT NOT NULL,
  status       TEXT DEFAULT 'anonymous' CHECK (status IN ('anonymous','unlocked')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_buyer ON chat_sessions (buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_seller ON chat_sessions (seller_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  sender_id   TEXT NULL,
  content     TEXT NOT NULL,
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id);

CREATE TABLE IF NOT EXISTS feed_interactions (
  id                BIGSERIAL PRIMARY KEY,
  item_type         TEXT NOT NULL,
  item_id           TEXT NOT NULL,
  interaction_type  TEXT NOT NULL CHECK (interaction_type IN ('view','click','upvote','comment')),
  user_id           TEXT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_item ON feed_interactions (item_type, item_id);
