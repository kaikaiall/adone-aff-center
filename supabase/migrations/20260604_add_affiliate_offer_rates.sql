-- ================================================================
-- affiliate_offer_rates テーブル（アフィリエイター別特別単価）
-- + conversions テーブルへの amount カラム追加
-- + 既存 conversions.amount の補完 UPDATE
--
-- 実行方法：Supabase ダッシュボード → SQL Editor で実行
-- 注意：ALTER TABLE と UPDATE を必ずセットで1回のセッションで実行すること
-- ================================================================

-- ────────────────────────────────────────
-- 1. アフィリエイター × 案件 別の特別単価テーブル
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_offer_rates (
  id                 TEXT PRIMARY KEY,          -- rate_{timestamp}_{random}
  affiliate_id       TEXT NOT NULL,             -- affiliates.id（UUID値をTEXT格納）
  offer_id           TEXT NOT NULL,             -- offers.id（UUID値をTEXT格納）
  custom_optin_price INTEGER NOT NULL CHECK (custom_optin_price >= 0),
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_offer_rates_affiliate_id
  ON affiliate_offer_rates(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_offer_rates_offer_id
  ON affiliate_offer_rates(offer_id);

-- ────────────────────────────────────────
-- 2. conversions テーブルへ amount カラムを追加
--    DEFAULT 0 により既存レコードへの影響なし（補完 UPDATE は下記）
--    IF NOT EXISTS で冪等性確保（二重実行しても安全）
-- ────────────────────────────────────────
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────
-- 3. 既存 conversions レコードの amount を offers.optin_price で補完
--    offer_id が NULL のレコードは WHERE 条件不一致でスキップ（安全）
--    補完後、既存データの表示金額は現状と同じになる
-- ────────────────────────────────────────
UPDATE conversions
SET amount = offers.optin_price
FROM offers
WHERE conversions.offer_id = offers.id
  AND conversions.amount = 0;
