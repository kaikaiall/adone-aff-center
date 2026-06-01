-- conversions_backend テーブルに status カラムを追加
ALTER TABLE conversions_backend
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('approved', 'rejected', 'pending', 'deleted'));
