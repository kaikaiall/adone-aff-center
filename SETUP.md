# LINE アフィリエイト管理プラットフォーム セットアップガイド

## 1. Supabase 初期設定

Supabase ダッシュボード (https://axtyxwpgxnyfexiivyxs.supabase.co) にログインし、
SQL エディタで `supabase/schema.sql` の内容を実行してください。

## 2. 環境変数の設定

`.env.local` を編集してください：

```env
NEXT_PUBLIC_SUPABASE_URL=https://axtyxwpgxnyfexiivyxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase ダッシュボード > Settings > API > anon key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase ダッシュボード > Settings > API > service_role key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_PASSWORD=admin1234
```

## 3. 起動

```bash
cd line-aff-center
npm run dev
```

## 4. アクセス

| ページ | URL |
|--------|-----|
| トップ | http://localhost:3000 |
| 管理画面ログイン | http://localhost:3000/admin/login |
| アフィリエイターログイン | http://localhost:3000/affiliate/login |

## 5. テストアカウント

**管理者パスワード:** admin1234

**テストアフィリエイター（全員パスワード: test1234）:**
| 名前 | メール |
|------|--------|
| 田中 太郎 | tanaka@test.com |
| 佐藤 花子 | sato@test.com |
| 山田 次郎 | yamada@test.com |
| 鈴木 美咲 | suzuki@test.com |
| 高橋 健一 | takahashi@test.com |

## 6. Webhook 設定

**エンドポイント:** `POST https://<your-domain>/api/webhook/conversion`

### Lステップ設定例
```json
{
  "lineUserId": "{{lineUserId}}",
  "displayName": "{{displayName}}",
  "cid": "アフィリエイターのcid値",
  "offerId": "案件ID"
}
```

### UTAGE / エルメ / プロライン 設定例
```json
{
  "line_user_id": "{{line_user_id}}",
  "display_name": "{{display_name}}",
  "cid": "アフィリエイターのcid値"
}
```

### テスト curl コマンド
```bash
curl -X POST http://localhost:3000/api/webhook/conversion \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "Utest123456",
    "displayName": "テストユーザー",
    "cid": "<アフィリエイトリンクページで取得したcid>"
  }'
```

## 7. アフィリエイトリンクの仕組み

1. アフィリエイターがログイン
2. 「リンク取得」から案件を選択
3. 「アフィリエイトリンクを生成」をクリック
4. 生成されたURLに `?cid=xxxxx` パラメータが付与される
5. そのリンクをSNSなどで拡散
6. LINE登録者がWebhook経由でコンバージョン計測される

## 8. DB テーブル構成

- `affiliates` - アフィリエイター情報
- `offers` - 案件情報（詳細コンテンツJSON含む）
- `conversions` - コンバージョン記録（pending/approved/rejected）
- `conversions_backend` - バックエンド報酬（手動入力）
- `users` - LINEユーザー情報
- `affiliate_links` - cid ↔ affiliate_id + offer_id マッピング
