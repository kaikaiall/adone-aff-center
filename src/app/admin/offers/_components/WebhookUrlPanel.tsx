'use client'
import { useState, useEffect, useCallback } from 'react'

interface WebhookUrlPanelProps {
  offerId: string
  webhookSecret?: string
}

type CRMKey = 'proline' | 'lstep' | 'utage' | 'lme' | 'myasp' | 'generic'

interface CRMConfig {
  key: CRMKey
  label: string
  url: (base: string, offerId: string) => string
  method: 'GET' | 'POST'
  settingPath: string
  warningPath: string[]
  notes: string
}

const CRM_CONFIGS: CRMConfig[] = [
  {
    key: 'proline',
    label: 'プロライン',
    url: (base, offerId) =>
      `${base}?source=proline&lineUserId=[[uid]]&displayName=[[snsname]]&offerId=${offerId}&cid=[[CID]]`,
    method: 'GET',
    settingPath: '管理画面 → 設定 → 外部通知 → コンバージョン通知URL',
    warningPath: [
      'ステップ配信内のURL',
      'メッセージ本文',
      '配信トリガー設定',
    ],
    notes: '友だち追加経路パラメータの「cid」がプロライン側で取得できる設定になっている必要があります。',
  },
  {
    key: 'lstep',
    label: 'Lステップ',
    url: (base, offerId) =>
      `${base}?source=lstep&lineUserId={user_id}&displayName={display_name}&offerId=${offerId}&cid={cid}`,
    method: 'GET',
    settingPath: '管理画面 → 自動化 → 外部連携 → Webhook URL',
    warningPath: [
      'シナリオ内のURL設定',
      'メッセージテンプレート',
      '友だち追加時の自動アクション以外',
    ],
    notes: 'プレースホルダ「{user_id}」「{cid}」などはLステップの仕様に合わせて編集が必要な場合があります。',
  },
  {
    key: 'utage',
    label: 'UTAGE',
    url: (base, offerId) =>
      `${base}?source=utage&lineUserId={line_user_id}&displayName={display_name}&offerId=${offerId}&cid={cid}`,
    method: 'GET',
    settingPath: 'フォーム設定 → サンクスページ → Webhook通知URL',
    warningPath: [
      'メール配信のURL',
      'リダイレクトURL',
    ],
    notes: 'UTAGEはPOST送信にも対応しています。GETで動作しない場合はPOSTに切り替えてください。',
  },
  {
    key: 'lme',
    label: 'エルメ',
    url: (base, offerId) =>
      `${base}?source=lme&lineUserId={{line_user_id}}&displayName={{display_name}}&offerId=${offerId}&cid={{cid}}`,
    method: 'GET',
    settingPath: 'アクション設定 → 外部URL通知',
    warningPath: [
      'ステップ配信のメッセージ',
      'リッチメニューのアクション',
    ],
    notes: 'エルメのプレースホルダ記法は二重波括弧「{{...}}」です。',
  },
  {
    key: 'myasp',
    label: 'MyASP',
    url: (base, offerId) =>
      `${base}?source=myasp&lineUserId=%%line_user_id%%&displayName=%%name%%&offerId=${offerId}&cid=%%cid%%`,
    method: 'GET',
    settingPath: 'シナリオ設定 → 外部連携 → Webhook URL',
    warningPath: [
      'メール本文内のURL',
      '購読者URL',
    ],
    notes: 'MyASPのプレースホルダ記法はパーセント記号「%%...%%」です。',
  },
  {
    key: 'generic',
    label: '汎用',
    url: (base, offerId) =>
      `${base}?source=custom&lineUserId={LINE_USER_ID}&displayName={DISPLAY_NAME}&offerId=${offerId}&cid={CID}`,
    method: 'GET',
    settingPath: '利用CRMの「外部通知」または「Webhook URL」設定欄',
    warningPath: [
      'ステップ配信や自動メッセージ系の設定欄',
    ],
    notes: '{LINE_USER_ID}、{DISPLAY_NAME}、{CID} の部分を、利用しているCRMのプレースホルダ記法に置き換えてください。',
  },
]

export default function WebhookUrlPanel({ offerId, webhookSecret }: WebhookUrlPanelProps) {
  const [activeCRM, setActiveCRM] = useState<CRMKey>('proline')
  const [baseUrl, setBaseUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedSimple, setCopiedSimple] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(`${window.location.origin}/api/webhook/conversion`)
    }
  }, [])

  // CRM非依存の簡易Webhook URL（lineUserIdのみ必須）
  const simpleWebhookUrl = baseUrl
    ? `${baseUrl}?lineUserId=[[uid]]&displayName=[[snsname]]${webhookSecret ? `&secret=${encodeURIComponent(webhookSecret)}` : ''}`
    : ''

  const handleCopySimple = useCallback(async () => {
    if (!simpleWebhookUrl) return
    try {
      await navigator.clipboard.writeText(simpleWebhookUrl)
      setCopiedSimple(true)
      setTimeout(() => setCopiedSimple(false), 2500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [simpleWebhookUrl])

  const currentConfig = CRM_CONFIGS.find(c => c.key === activeCRM)!
  const baseGeneratedUrl = baseUrl ? currentConfig.url(baseUrl, offerId) : ''
  // シークレットが設定されている場合は末尾に &secret=xxx を付与
  const webhookUrl = baseGeneratedUrl && webhookSecret
    ? `${baseGeneratedUrl}&secret=${encodeURIComponent(webhookSecret)}`
    : baseGeneratedUrl

  const handleCopy = async () => {
    if (!webhookUrl) return
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="border-t pt-5 mt-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">📡 CRM連携 Webhook URL</h3>
      <p className="text-xs text-gray-500 mb-3">
        利用するCRMツールを選んでURLをコピーし、各CRMの「外部通知」設定に貼り付けてください。
      </p>

      {/* セキュリティ警告：シークレット未設定時 */}
      {!webhookSecret && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-red-800 mb-1">⚠️ セキュリティ警告</p>
          <p className="text-xs text-red-700">
            Webhookのシークレットキーが設定されていません。Vercelの環境変数に <code className="bg-red-100 px-1 rounded">WEBHOOK_SECRET</code> を設定することを強く推奨します。
            設定しないと第三者が成果を偽造できる可能性があります。
          </p>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* おすすめ：CRM非依存の自動紐付け方式        */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
        <p className="text-sm font-bold text-green-800 mb-1">🎯 おすすめ：CRM非依存の自動紐付け方式</p>
        <p className="text-xs text-green-700 mb-3">
          アフィリエイターがADoneの紹介リンク（<code className="bg-green-100 px-1 rounded">/r/[cid]</code>）をクリックしてから<strong>30分以内</strong>に友達追加された場合、
          ADoneが自動でcidとofferIdを補完します。CRM特有のパラメータ名（free1等）を気にする必要はありません。
        </p>
        <ul className="text-xs text-green-700 list-disc list-inside mb-3 space-y-0.5">
          <li>プロライン・Lステップ・UTAGE・エルメなどあらゆるCRMで動作</li>
          <li>CRM側で <code className="bg-green-100 px-1 rounded">lineUserId</code>（LINE UID）が取得できれば成果計測が成立</li>
          <li>cidやofferIdの引き回しは不要</li>
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={simpleWebhookUrl}
            className="flex-1 border border-green-300 rounded-lg px-3 py-2 text-xs font-mono bg-white text-gray-700"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={handleCopySimple}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              copiedSimple ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {copiedSimple ? '✓ コピー済' : '📋 コピー'}
          </button>
        </div>
        <p className="text-xs text-green-600 mt-2">
          ※ <code className="bg-green-100 px-1 rounded">[[uid]]</code> と <code className="bg-green-100 px-1 rounded">[[snsname]]</code> はプロラインのプレースホルダです。他のCRMをお使いの場合は下の「上級者向け」を参照してください。
        </p>
      </div>

      {/* 上級者向け：完全指定方式（折りたたみ） */}
      <details open={advancedOpen} onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)} className="border border-gray-200 rounded-lg mb-3">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg select-none">
          🔧 上級者向け：CRM別の完全指定方式（cid・offerIdを明示的に渡す）
        </summary>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">
            CRMのパラメータ引き回し設定に慣れている場合は、こちらの形式でcidとofferIdを明示的に渡すこともできます。
          </p>

      {/* タブ */}
      <div className="flex flex-wrap gap-1 mb-3 border-b border-gray-200">
        {CRM_CONFIGS.map(config => (
          <button
            key={config.key}
            type="button"
            onClick={() => { setActiveCRM(config.key); setCopied(false) }}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeCRM === config.key
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* URL表示 */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Webhook URL（{currentConfig.method}方式）
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 text-gray-700"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? '✓ コピー済' : '📋 コピー'}
            </button>
          </div>
        </div>

        {/* 設定する場所 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-800 mb-1">
            ✅ 設定する場所
          </p>
          <p className="text-xs text-blue-700 font-mono">{currentConfig.settingPath}</p>
        </div>

        {/* 警告：絶対に貼らない場所 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-800 mb-1">
            ❌ 絶対に貼らない場所（ステップ配信が止まる可能性あり）
          </p>
          <ul className="text-xs text-red-700 list-disc list-inside space-y-0.5">
            {currentConfig.warningPath.map((path, i) => (
              <li key={i}>{path}</li>
            ))}
          </ul>
        </div>

        {/* 補足 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-yellow-800 mb-1">💡 補足</p>
          <p className="text-xs text-yellow-700">{currentConfig.notes}</p>
        </div>

        {/* テスト手順 */}
        <details className="border border-gray-200 rounded-lg">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg">
            🧪 設定後の動作確認手順
          </summary>
          <div className="px-3 py-3 text-xs text-gray-600 space-y-1.5">
            <p>1. テスト用のLINEアカウントで、案件の友だち追加URLから登録</p>
            <p>2. CRMツール側のステップ配信が通常通り流れることを確認</p>
            <p>3. ADoneの「成果一覧」に新しい成果が記録されているか確認</p>
            <p>4. 両方OKなら本番運用開始</p>
            <p className="text-gray-500 italic">
              ※ ADone側でエラーが起きてもステップ配信に影響しないよう設計されていますが、
              念のため初回は必ずテストすることを推奨します。
            </p>
          </div>
        </details>
      </div>{/* space-y-3 */}
        </div>{/* p-4 */}
      </details>{/* 上級者向け折りたたみ */}

    </div>
  )
}
