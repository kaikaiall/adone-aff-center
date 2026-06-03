-- ================================================================
-- link_clicks テーブル
-- 目的：中継ページ（/r/[cid]）でのクリックを記録し、
--        後からWebhookで来た成果と紐付けるための基盤テーブル
-- 実行方法：Supabase ダッシュボード → SQL Editor で実行
-- ================================================================

CREATE TABLE IF NOT EXISTS link_clicks (
  id                     TEXT PRIMARY KEY,          -- click_<timestamp>_<random>
  cid                    TEXT NOT NULL,             -- affiliate_links.cid または aff_xxx 直接ID
  affiliate_id           TEXT NULL,                 -- 解決済みアフィリエイターID
  offer_id               TEXT NULL,                 -- 解決済み案件ID
  ip_address             TEXT NULL,
  user_agent             TEXT NULL,
  cookie_id              TEXT NULL,                 -- 中継ページで発行した一意ID (adone_click_id Cookie)
  referer                TEXT NULL,
  clicked_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at             TIMESTAMPTZ NULL,          -- この クリックが成果に紐づいた時刻
  matched_conversion_id  TEXT NULL                  -- 紐づいた conversions.id
);

-- インデックス: IP+UA で紐付けクエリ用
CREATE INDEX IF NOT EXISTS idx_link_clicks_ip_ua_time
  ON link_clicks (ip_address, user_agent, clicked_at DESC);

-- インデックス: Cookie で検索用
CREATE INDEX IF NOT EXISTS idx_link_clicks_cookie_time
  ON link_clicks (cookie_id, clicked_at DESC);

-- インデックス: 時系列検索用
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at
  ON link_clicks (clicked_at DESC);
