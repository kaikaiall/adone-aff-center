-- Fix: offers テーブルに TEXT 形式ID（offer_xxx）が存在する場合、
-- conversions_backend との FK 制約違反が発生するため削除する。
--
-- ⚠️ 適用前に必ずバックアップを取ること。
-- Supabase Dashboard > SQL Editor で実行する。

-- 1. offer_xxx 形式の古いTEXT-ID案件を確認（実行のみ・削除前確認用）
SELECT id, name, created_at
FROM offers
WHERE id NOT LIKE '________-____-____-____-____________';  -- UUID形式でないもの

-- 2. FK違反を起こすoffer_xxx形式IDの案件を削除（確認後にコメント解除して実行）
-- ※ conversions_backend に参照されていない場合のみ削除可能
-- DELETE FROM offers
-- WHERE id NOT LIKE '________-____-____-____-____________';

-- 3. backend_rate カラムが存在しない場合は追加（エラーになる場合は無視）
ALTER TABLE offers ADD COLUMN IF NOT EXISTS backend_rate NUMERIC;

-- 4. is_active カラムが存在しない場合は追加
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
