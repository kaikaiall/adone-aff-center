-- LINE Affiliate Management Platform Schema

-- affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  account_info TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  optin_price INTEGER NOT NULL DEFAULT 0,
  has_backend BOOLEAN NOT NULL DEFAULT FALSE,
  content JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  line_user_id TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'rejected', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversions_backend table
CREATE TABLE IF NOT EXISTS conversions_backend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  amount INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- users (LINE users) table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- affiliate_links table (cid mapping)
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  cid TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate_id ON conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_offer_id ON conversions(offer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_cid ON affiliate_links(cid);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);

-- Test affiliates (password: test1234 -> sha256 hash stored as plain for demo)
INSERT INTO affiliates (name, email, account_info, password_hash) VALUES
  ('田中 太郎', 'tanaka@test.com', '三菱UFJ銀行 渋谷支店 普通 1234567', 'test1234'),
  ('佐藤 花子', 'sato@test.com', 'ゆうちょ銀行 記号12345 番号678901', 'test1234'),
  ('山田 次郎', 'yamada@test.com', '三井住友銀行 新宿支店 普通 9876543', 'test1234'),
  ('鈴木 美咲', 'suzuki@test.com', 'りそな銀行 池袋支店 普通 1122334', 'test1234'),
  ('高橋 健一', 'takahashi@test.com', 'みずほ銀行 銀座支店 普通 5566778', 'test1234')
ON CONFLICT (email) DO NOTHING;

-- Sample offers
INSERT INTO offers (name, optin_price, has_backend, content, is_active) VALUES
  ('サンプル案件A', 500, false, '{"description":"LINE登録で500円報酬","banner":"","lp_url":"https://example.com"}', true),
  ('サンプル案件B', 800, true, '{"description":"LINE登録+バックエンド報酬あり","banner":"","lp_url":"https://example.com"}', true)
ON CONFLICT DO NOTHING;
