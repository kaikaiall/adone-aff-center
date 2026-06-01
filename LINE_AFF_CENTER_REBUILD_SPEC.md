# LINE オプトインアフィリエイト管理プラットフォーム
## 完全再実装仕様書（Claude Code 向け指示書）

---

## 📋 目次

1. [現在の状況](#1-現在の状況)
2. [問題点の詳細](#2-問題点の詳細)
3. [改善方針](#3-改善方針)
4. [技術スタック](#4-技術スタック)
5. [データベース設計](#5-データベース設計)
6. [API エンドポイント仕様](#6-api-エンドポイント仕様)
7. [管理画面仕様](#7-管理画面仕様)
8. [アフィリエイターポータル仕様](#8-アフィリエイターポータル仕様)
9. [認証システム仕様](#9-認証システム仕様)
10. [Webhook 仕様（最重要）](#10-webhook-仕様最重要)
11. [テスト要件](#11-テスト要件)
12. [エラーハンドリング基準](#12-エラーハンドリング基準)
13. [Claude Code への実装指示](#13-claude-code-への実装指示)

---

## 1. 現在の状況

### ✅ 完了している機能
- Next.js + Supabase の基本環境構築
- ブラウザでアプリケーション起動（http://localhost:3001）
- 管理画面ログイン UI（パスワード：admin1234）
- アフィリエイターログイン UI（tanaka@test.com / test1234）
- Supabase スキーマ作成（affiliates, offers, conversions等）
- テストデータ生成（アフィリエイター5人、案件2件）

### ❌ 問題が発生している機能
**Webhook エンドポイント（POST /api/webhook/conversion）が HTTP 400 エラーを返す**

具体的なエラー：
```json
{
  "error": "Could not resolve affiliate or offer from cid/offerId",
  "received": {
    "lineUserId": "Utest12345abcdef1234567890",
    "cid": "aff_001",
    "offerId": "offer_001"
  }
}
```

### 検証済み事項
- ✅ Supabase テーブルは正常作成されている
- ✅ `affiliates` テーブルに aff_001～aff_005 が存在
- ✅ `offers` テーブルに offer_001、offer_002 が存在
- ✅ `.env.local` は正しく設定されている
- ❌ Webhook エンドポイント内で SQL クエリが正しく動作していない

---

## 2. 問題点の詳細

### 根本原因（推定）
1. **Webhook エンドポイントのコード問題**
   - Supabase クライアントの呼び出し方が間違っている
   - SQL クエリのフィルター条件が間違っている
   - リクエストボディのパース処理に問題がある

2. **デバッグ情報が不足**
   - エラー発生時に詳細な情報が出力されていない
   - どのステップで失敗したか不明

3. **テストカバレッジが低い**
   - 各機能ごとの単体テストがない
   - 統合テストもない

---

## 3. 改善方針

### 基本方針：「バグが起こらない徹底的な再実装」

1. **完全な再実装**
   - 既存コードに依存せず、ゼロから書き直す
   - 各機能を小さく分割して実装

2. **エラーハンドリングの徹底**
   - すべての関数で try-catch
   - 詳細なエラーメッセージ
   - console.log でデバッグ情報を出力

3. **テスト駆動開発**
   - 各機能を実装後、即座にテスト
   - テストスクリプトを用意

4. **段階的な実装**
   - フェーズ1：データベース層（Supabase クライアント）
   - フェーズ2：API エンドポイント（Webhook 含む）
   - フェーズ3：管理画面
   - フェーズ4：アフィリエイターポータル
   - フェーズ5：認証システム
   - フェーズ6：統合テスト

---

## 4. 技術スタック

### 必須技術
- **フレームワーク**: Next.js 14（App Router）
- **言語**: TypeScript（strict mode）
- **データベース**: Supabase PostgreSQL
- **ORM**: Supabase JS Client（@supabase/supabase-js）
- **スタイリング**: Tailwind CSS
- **認証**: NextAuth.js または Supabase Auth
- **状態管理**: React Server Components + Server Actions

### ディレクトリ構成
```
line-aff-center/
├── app/
│   ├── (admin)/             # 管理画面
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── offers/      # 案件管理
│   │   │   ├── conversions/ # 成果一覧
│   │   │   ├── backend/     # バックエンド報酬入力
│   │   │   └── affiliates/  # アフィリエイター管理
│   ├── (affiliate)/         # アフィリエイターポータル
│   │   ├── affiliate/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── links/       # リンク取得
│   │   │   └── profile/     # プロフィール
│   ├── api/
│   │   ├── webhook/
│   │   │   └── conversion/  # ★★ Webhook エンドポイント ★★
│   │   ├── admin/
│   │   │   ├── conversions/
│   │   │   ├── offers/
│   │   │   └── ...
│   │   └── affiliate/
│   │       ├── conversions/
│   │       ├── links/
│   │       └── ...
│   └── layout.tsx
├── lib/
│   ├── supabase.ts          # Supabase クライアント
│   ├── auth.ts              # 認証ロジック
│   └── types.ts             # TypeScript 型定義
├── middleware.ts
├── .env.local
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 5. データベース設計

### 完全なスキーマ（Supabase SQL Editor で実行）

```sql
-- ===== 既存テーブルを削除 =====
DROP TABLE IF EXISTS affiliate_links CASCADE;
DROP TABLE IF EXISTS conversions_backend CASCADE;
DROP TABLE IF EXISTS conversions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;

-- ===== affiliates テーブル =====
CREATE TABLE affiliates (
  id TEXT PRIMARY KEY,                  -- aff_001 など
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- 本番は bcrypt 推奨
  phone TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_type TEXT,               -- 普通/当座
  bank_account_number TEXT,
  bank_account_holder TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== offers テーブル =====
CREATE TABLE offers (
  id TEXT PRIMARY KEY,                  -- offer_001 など
  name TEXT NOT NULL,
  optin_price INTEGER NOT NULL DEFAULT 0,  -- オプトイン単価
  has_backend BOOLEAN NOT NULL DEFAULT FALSE,
  backend_rate NUMERIC(5,2),            -- バックエンド料率（15-20%）
  description TEXT,                     -- 案件説明
  banner_url TEXT,                      -- バナー画像 URL
  lp_url TEXT,                          -- LP の URL
  line_add_url TEXT,                    -- LINE 友だち追加 URL
  appeal_points TEXT,                   -- アピールポイント
  target_audience TEXT,                 -- ターゲット
  notes TEXT,                           -- 注意事項
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== conversions テーブル（オプトイン成果） =====
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'rejected', 'pending')),
  source TEXT,                          -- lstep/utage/elme/proline等
  ip_address TEXT,                      -- 不正検知用
  user_agent TEXT,
  raw_payload JSONB,                    -- 元のリクエストボディ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== conversions_backend テーブル（バックエンド成果手動入力） =====
CREATE TABLE conversions_backend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,    -- 報酬額
  count INTEGER NOT NULL DEFAULT 1,     -- 件数
  note TEXT,                            -- メモ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);

-- ===== users テーブル（LINE ユーザー） =====
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== affiliate_links テーブル（cid 管理） =====
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  cid TEXT UNIQUE NOT NULL,             -- 一意な cid
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== インデックス =====
CREATE INDEX idx_conversions_affiliate_id ON conversions(affiliate_id);
CREATE INDEX idx_conversions_offer_id ON conversions(offer_id);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_created_at ON conversions(created_at DESC);
CREATE INDEX idx_affiliate_links_cid ON affiliate_links(cid);
CREATE INDEX idx_affiliate_links_affiliate_offer ON affiliate_links(affiliate_id, offer_id);

-- ===== テストデータ：アフィリエイター 5人 =====
INSERT INTO affiliates (id, name, email, password_hash, phone) VALUES
  ('aff_001', '田中 太郎', 'tanaka@test.com', 'test1234', '090-1111-2222'),
  ('aff_002', '佐藤 花子', 'sato@test.com', 'test1234', '090-2222-3333'),
  ('aff_003', '山田 次郎', 'yamada@test.com', 'test1234', '090-3333-4444'),
  ('aff_004', '鈴木 美咲', 'suzuki@test.com', 'test1234', '090-4444-5555'),
  ('aff_005', '高橋 健一', 'takahashi@test.com', 'test1234', '090-5555-6666');

-- ===== テストデータ：案件 2件 =====
INSERT INTO offers (id, name, optin_price, has_backend, backend_rate, description, appeal_points, target_audience, notes) VALUES
  ('offer_001', 'サンプル案件A', 500, FALSE, NULL, 'LINE登録で500円報酬。シンプルなオプトイン案件です。', '・高転換率\n・無料プレゼントあり', '20〜40代', '重複登録禁止'),
  ('offer_002', 'プレミアム案件B', 1000, TRUE, 15.00, '投資教育LINE講座。バックエンド報酬あり。', '・高単価1000円\n・バックエンド15%', '30〜50代', '18歳以上のみ');

-- ===== テストデータ：affiliate_links =====
INSERT INTO affiliate_links (affiliate_id, offer_id, cid) VALUES
  ('aff_001', 'offer_001', 'cid_aff001_offer001'),
  ('aff_001', 'offer_002', 'cid_aff001_offer002'),
  ('aff_002', 'offer_001', 'cid_aff002_offer001'),
  ('aff_002', 'offer_002', 'cid_aff002_offer002'),
  ('aff_003', 'offer_001', 'cid_aff003_offer001'),
  ('aff_004', 'offer_001', 'cid_aff004_offer001'),
  ('aff_005', 'offer_001', 'cid_aff005_offer001');
```

---

## 6. API エンドポイント仕様

### 6-1. 認証 API
- `POST /api/admin/login` - 管理者ログイン
- `POST /api/affiliate/login` - アフィリエイターログイン
- `POST /api/logout` - ログアウト

### 6-2. 管理者 API
- `GET /api/admin/affiliates` - アフィリエイター一覧
- `POST /api/admin/affiliates` - アフィリエイター追加
- `PATCH /api/admin/affiliates/[id]` - アフィリエイター更新
- `DELETE /api/admin/affiliates/[id]` - アフィリエイター削除

- `GET /api/admin/offers` - 案件一覧
- `POST /api/admin/offers` - 案件追加
- `PATCH /api/admin/offers/[id]` - 案件更新
- `DELETE /api/admin/offers/[id]` - 案件削除

- `GET /api/admin/conversions` - 成果一覧
- `PATCH /api/admin/conversions/[id]` - 成果ステータス変更（approved/rejected）
- `DELETE /api/admin/conversions/[id]` - 成果完全削除

- `POST /api/admin/backend` - バックエンド報酬手動入力
- `GET /api/admin/backend` - バックエンド報酬一覧
- `DELETE /api/admin/backend/[id]` - バックエンド報酬削除

### 6-3. アフィリエイター API
- `GET /api/affiliate/conversions` - 自分の成果一覧（approved のみ）
- `GET /api/affiliate/links` - 自分の案件リスト
- `POST /api/affiliate/links` - リンク生成
- `GET /api/affiliate/profile` - プロフィール取得
- `PATCH /api/affiliate/profile` - プロフィール更新

### 6-4. Webhook API（最重要）
- `POST /api/webhook/conversion` - 成果受信

---

## 7. 管理画面仕様

### 7-1. ログイン画面
- URL: `/admin/login`
- フィールド：パスワード
- 認証成功 → `/admin/dashboard` へリダイレクト

### 7-2. ダッシュボード
- URL: `/admin/dashboard`
- 表示：今月の成果件数、報酬合計、アフィリエイター数、案件数

### 7-3. 案件管理
- URL: `/admin/offers`
- 一覧表示
- 新規追加フォーム：
  - 案件名
  - オプトイン単価
  - バックエンド有無 + 料率
  - 説明文
  - バナー URL
  - LP の URL
  - LINE 友だち追加 URL
  - アピールポイント
  - ターゲット
  - 注意事項
  - 有効/無効

### 7-4. 成果一覧
- URL: `/admin/conversions`
- フィルター：案件、アフィリエイター、ステータス、日付範囲
- 各成果に対して操作可能：
  - approved（承認）
  - rejected（非承認）
  - 完全削除（pending → rejected → 削除も可能）
- **重要**：rejected と削除はアフィリエイター側に表示されない

### 7-5. バックエンド報酬入力
- URL: `/admin/backend`
- フォーム：
  - アフィリエイター選択（ドロップダウン）
  - 案件選択（ドロップダウン）
  - 件数
  - 金額
  - メモ
- 履歴一覧

### 7-6. アフィリエイター管理
- URL: `/admin/affiliates`
- 一覧表示
- 新規追加・編集・削除

---

## 8. アフィリエイターポータル仕様

### 8-1. ログイン画面
- URL: `/affiliate/login`
- フィールド：メールアドレス、パスワード

### 8-2. ダッシュボード
- URL: `/affiliate/dashboard`
- 表示内容：
  - 今月の成果件数（**approved のみ**）
  - 報酬合計
  - 案件別の成果

### 8-3. リンク取得
- URL: `/affiliate/links`
- 案件一覧表示
- 案件選択時：
  - 詳細情報表示（説明、アピールポイント、注意事項等）
  - バナー画像表示
  - LP の URL 表示
  - **cid 付きの友だち追加リンクを生成・コピー**
- 形式：`https://line.me/R/...&cid={cid}`

### 8-4. プロフィール
- URL: `/affiliate/profile`
- フィールド：
  - 名前
  - メール
  - 電話番号
  - 銀行名、支店名、口座種別、口座番号、口座名義
- 編集機能

---

## 9. 認証システム仕様

### 9-1. 管理者認証
- 方式：パスワード認証
- パスワード：`.env.local` の `ADMIN_PASSWORD`
- セッション管理：HTTP-only Cookie

### 9-2. アフィリエイター認証
- 方式：メール + パスワード
- パスワード：`affiliates.password_hash` と照合
- セッション管理：HTTP-only Cookie

### 9-3. ミドルウェア
- `/admin/*` → 管理者認証必須
- `/affiliate/*` → アフィリエイター認証必須
- 未認証時 → ログイン画面へリダイレクト

---

## 10. Webhook 仕様（最重要）

### 10-1. エンドポイント
- URL: `POST /api/webhook/conversion`
- Content-Type: `application/json`

### 10-2. リクエスト形式（汎用）

**汎用形式（推奨）：**
```json
{
  "source": "lstep",
  "lineUserId": "U1234567890abcdef",
  "displayName": "ユーザー名",
  "offerId": "offer_001",
  "cid": "aff_001"
}
```

**柔軟な命名対応：**
- `lineUserId` / `line_user_id` / `userId`
- `displayName` / `display_name`
- `offerId` / `offer_id`
- `cid` / `aff_id` / `affiliate_id`

### 10-3. 処理フロー

```typescript
// 1. リクエストボディをパース
const body = await request.json();
console.log('[Webhook] Received:', body);

// 2. フィールドを正規化
const normalized = {
  lineUserId: body.lineUserId || body.line_user_id || body.userId,
  displayName: body.displayName || body.display_name,
  offerId: body.offerId || body.offer_id,
  cid: body.cid || body.aff_id || body.affiliate_id,
  source: body.source || 'unknown',
};
console.log('[Webhook] Normalized:', normalized);

// 3. 必須フィールドチェック
if (!normalized.lineUserId || !normalized.cid || !normalized.offerId) {
  return Response.json({ 
    error: 'Missing required fields',
    debug: { received: body, normalized }
  }, { status: 400 });
}

// 4. アフィリエイター ID を解決
//    cid は affiliate_links テーブルから取得するが、
//    cid=aff_001 のように直接アフィリエイター ID が来た場合もサポート
let affiliateId = null;

// 4-1. まず affiliate_links から検索
const { data: linkData, error: linkError } = await supabase
  .from('affiliate_links')
  .select('affiliate_id')
  .eq('cid', normalized.cid)
  .single();

if (linkData) {
  affiliateId = linkData.affiliate_id;
} else {
  // 4-2. cid が直接アフィリエイター ID の場合
  const { data: affData } = await supabase
    .from('affiliates')
    .select('id')
    .eq('id', normalized.cid)
    .single();
  
  if (affData) {
    affiliateId = affData.id;
  }
}

console.log('[Webhook] Affiliate resolved:', affiliateId);

if (!affiliateId) {
  return Response.json({
    error: 'Affiliate not found',
    debug: { cid: normalized.cid }
  }, { status: 400 });
}

// 5. 案件 ID を検証
const { data: offerData, error: offerError } = await supabase
  .from('offers')
  .select('id')
  .eq('id', normalized.offerId)
  .single();

console.log('[Webhook] Offer check:', offerData, offerError);

if (!offerData) {
  return Response.json({
    error: 'Offer not found',
    debug: { offerId: normalized.offerId }
  }, { status: 400 });
}

// 6. 成果を挿入
const { data: conversion, error: convError } = await supabase
  .from('conversions')
  .insert({
    affiliate_id: affiliateId,
    offer_id: normalized.offerId,
    line_user_id: normalized.lineUserId,
    display_name: normalized.displayName,
    status: 'pending',
    source: normalized.source,
    raw_payload: body,
  })
  .select()
  .single();

console.log('[Webhook] Conversion inserted:', conversion, convError);

if (convError) {
  return Response.json({
    error: 'Failed to insert conversion',
    debug: { error: convError.message }
  }, { status: 500 });
}

// 7. LINE ユーザー情報を upsert
await supabase
  .from('users')
  .upsert({
    line_user_id: normalized.lineUserId,
    display_name: normalized.displayName,
    last_seen_at: new Date().toISOString(),
  }, {
    onConflict: 'line_user_id'
  });

// 8. 成功レスポンス
return Response.json({
  success: true,
  conversionId: conversion.id,
  status: 'pending'
}, { status: 200 });
```

### 10-4. レスポンス形式

**成功時（200）：**
```json
{
  "success": true,
  "conversionId": "uuid-here",
  "status": "pending"
}
```

**失敗時（400）：**
```json
{
  "error": "詳細なエラーメッセージ",
  "debug": {
    "received": {...},
    "normalized": {...},
    "failedAt": "affiliate_lookup"
  }
}
```

---

## 11. テスト要件

### 11-1. 各機能ごとの単体テスト

**Webhook テスト：**
```bash
# 正常系
curl -X POST http://localhost:3001/api/webhook/conversion ^
  -H "Content-Type: application/json" ^
  -d "{\"source\":\"lstep\",\"lineUserId\":\"Utest001\",\"displayName\":\"テスト太郎\",\"offerId\":\"offer_001\",\"cid\":\"aff_001\"}"

# 異常系：必須フィールド欠落
curl -X POST http://localhost:3001/api/webhook/conversion ^
  -H "Content-Type: application/json" ^
  -d "{}"

# 異常系：存在しない案件
curl -X POST http://localhost:3001/api/webhook/conversion ^
  -H "Content-Type: application/json" ^
  -d "{\"lineUserId\":\"Utest001\",\"offerId\":\"offer_xxx\",\"cid\":\"aff_001\"}"

# 異常系：存在しないアフィリエイター
curl -X POST http://localhost:3001/api/webhook/conversion ^
  -H "Content-Type: application/json" ^
  -d "{\"lineUserId\":\"Utest001\",\"offerId\":\"offer_001\",\"cid\":\"aff_xxx\"}"
```

### 11-2. 統合テスト
- Webhook で成果受信 → 管理画面で表示確認
- 成果ステータス変更（pending → approved）→ アフィリエイターポータルで表示確認
- 成果ステータス変更（pending → rejected）→ アフィリエイターポータルで非表示確認
- 成果完全削除 → 両画面で消えていることを確認

---

## 12. エラーハンドリング基準

### 12-1. すべての API で実装
```typescript
export async function POST(request: Request) {
  try {
    // 処理内容
  } catch (error) {
    console.error('[API Error]', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
```

### 12-2. ロギング基準
- すべての API リクエストの開始/終了をログ出力
- データベース操作の前後にログ出力
- エラー発生時は詳細情報をログ出力

---

## 13. Claude Code への実装指示

### 🎯 実装の優先順位

1. **既存コードを完全に削除**
2. **データベーススキーマを再構築**（上記 SQL を実行）
3. **Supabase クライアントを再実装**（lib/supabase.ts）
4. **Webhook エンドポイントを最優先で実装**（最重要）
5. **Webhook が動作することを確認**
6. **管理画面 API を実装**
7. **アフィリエイター API を実装**
8. **管理画面 UI を実装**
9. **アフィリエイターポータル UI を実装**
10. **認証システムを実装**
11. **統合テストを実行**

### 📋 Claude Code への直接指示文

以下を Claude Code Desktop の入力欄にコピペしてください：

```
LINE オプトインアフィリエイト管理プラットフォームを完全に再実装してください。

【既存の問題】
Webhook エンドポイント（POST /api/webhook/conversion）が HTTP 400 エラーを返します。
データベースには aff_001 と offer_001 が存在するのに、「Could not resolve affiliate or offer」というエラーが出ます。

【実装方針】
バグが起こらないように、徹底的に完璧な実装を行ってください。

【手順】

1. まず既存のコードを確認し、問題点を分析してください。

2. データベーススキーマを完全に再構築してください。
   - 添付の LINE_AFF_CENTER_REBUILD_SPEC.md の「5. データベース設計」のSQL を Supabase で実行する手順を提示してください。

3. lib/supabase.ts を再実装してください。
   - createClient を正しく使用
   - Server Component と API Route の両方で使えるように

4. Webhook エンドポイント（app/api/webhook/conversion/route.ts）を最優先で実装してください。
   - 仕様書の「10. Webhook 仕様」のコードを完全に実装
   - 各ステップで console.log を追加
   - エラーハンドリングを徹底
   - 必ず詳細なデバッグ情報を返す

5. Webhook が動作することを確認してください。
   - curl コマンドでテスト
   - 成功時：{ success: true, conversionId: "..." }
   - 失敗時：詳細なエラーメッセージ

6. 管理画面 API を実装してください。
   - 仕様書の「6. API エンドポイント仕様」「7. 管理画面仕様」に従う

7. アフィリエイターポータル API を実装してください。
   - 仕様書の「6. API エンドポイント仕様」「8. アフィリエイターポータル仕様」に従う

8. 各 UI を実装してください。

9. 認証システムを実装してください。

10. 統合テストを実行してください。

【重要事項】
- TypeScript の strict mode を有効に
- すべての関数で try-catch
- すべての API でログ出力
- エラー発生時に詳細な情報を返す
- フィールド名の柔軟性をサポート（lineUserId / line_user_id 等）
- cid は affiliate_links テーブル経由と直接アフィリエイター ID の両方をサポート
- rejected と削除はアフィリエイター側に非表示
- バックエンド報酬は手動入力（自動計算ではない）

【テスト要件】
実装後、以下のテストが成功することを確認：

1. Webhook 正常系：
   curl -X POST http://localhost:3001/api/webhook/conversion ^
     -H "Content-Type: application/json" ^
     -d "{\"source\":\"lstep\",\"lineUserId\":\"Utest001\",\"displayName\":\"テスト太郎\",\"offerId\":\"offer_001\",\"cid\":\"aff_001\"}"
   → 200 + { success: true, conversionId: "..." }

2. 管理画面で成果確認：
   - http://localhost:3001/admin/conversions で新しい成果が表示される

3. ステータス変更：
   - approved に変更 → アフィリエイター側で表示
   - rejected に変更 → アフィリエイター側で非表示

4. アフィリエイターポータル：
   - http://localhost:3001/affiliate/dashboard で approved 成果のみ表示

【最終確認】
すべての機能が動作することを確認してから、実装完了とみなしてください。
バグが残ったまま「完了」と報告しないでください。
```

---

## 📞 サポート

実装後、各機能の動作確認を行います。
何か不明点があれば、随時質問してください。

---

**作成日：2026年6月1日**
**バージョン：1.0**
