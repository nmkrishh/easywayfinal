-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- JWT sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt analytics (your most valuable data)
CREATE TABLE prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  prompt_type TEXT,          -- 'website', 'app', 'edit', 'integration'
  category TEXT,             -- 'ecommerce', 'portfolio', 'restaurant', etc.
  model_used TEXT,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated prompt stats (for AI training decisions)
CREATE TABLE prompt_stats (
  category TEXT PRIMARY KEY,
  prompt_type TEXT,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_payment_id TEXT,
  amount_inr INTEGER,        -- in paise
  plan TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (each user's generated websites)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,     -- foreign key to admin.users
  name TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  theme JSONB DEFAULT '{}',
  domain TEXT,               -- custom domain if configured
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apps (React Native project bundles)
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  platform TEXT DEFAULT 'expo',
  files JSONB NOT NULL DEFAULT '{}', -- { 'App.js': '...code...' }
  config JSONB DEFAULT '{}',         -- app.json settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  images JSONB DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration configs
CREATE TABLE integrations (
  user_id UUID NOT NULL,
  type TEXT NOT NULL,         -- 'stripe', 'razorpay', 'analytics', etc.
  config JSONB NOT NULL,      -- encrypted keys/settings
  is_active BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, type)
);

-- Row Level Security (CRITICAL)
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their data" ON sites
  USING (user_id = auth.uid());
CREATE POLICY "Users own their data" ON apps
  USING (user_id = auth.uid());
