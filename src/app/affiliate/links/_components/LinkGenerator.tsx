'use client'
import { useState } from 'react'

export default function LinkGenerator({
  offers,
  myLinks,
}: {
  offers: any[]
  myLinks: any[]
  affiliateId: string
}) {
  const [selected, setSelected] = useState<any>(null)
  const [cid, setCid] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectOffer = (offer: any) => {
    setSelected(offer)
    setCopied(false)
    // 既存リンクがあれば即表示
    const existing = myLinks.find(l => l.offer_id === offer.id)
    setCid(existing?.cid || '')
  }

  const generateLink = async () => {
    if (!selected) return
    setLoading(true)
    const res = await fetch('/api/affiliate/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: selected.id }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.cid) setCid(data.cid)
  }

  // LINE友だち追加URLにcidを付与
  const affiliateUrl = cid && selected?.line_add_url
    ? `${selected.line_add_url}${selected.line_add_url.includes('?') ? '&' : '?'}cid=${cid}`
    : cid
    ? `${window?.location?.origin || ''}/offer/${selected?.id}?cid=${cid}`
    : ''

  const copyLink = () => {
    if (!affiliateUrl) return
    navigator.clipboard.writeText(affiliateUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* 案件リスト */}
      <div className="col-span-2 space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">案件一覧</h2>
        {offers.map(offer => {
          const hasLink = myLinks.some(l => l.offer_id === offer.id)
          return (
            <button
              key={offer.id}
              onClick={() => selectOffer(offer)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected?.id === offer.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">{offer.name}</div>
              <div className="text-green-600 text-sm mt-0.5">¥{offer.optin_price.toLocaleString()}/件</div>
              <div className="flex gap-1 mt-1">
                {offer.has_backend && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">バックエンドあり</span>}
                {hasLink && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">リンク取得済</span>}
              </div>
            </button>
          )
        })}
        {offers.length === 0 && <p className="text-gray-400 text-sm">公開中の案件がありません</p>}
      </div>

      {/* 案件詳細 + リンク生成 */}
      <div className="col-span-3">
        {selected ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{selected.name}</h2>
            <div className="flex gap-2 mb-4">
              <span className="bg-green-100 text-green-700 px-3 py-0.5 rounded-full text-sm font-medium">
                ¥{selected.optin_price.toLocaleString()}/件
              </span>
              {selected.has_backend && (
                <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-sm">
                  バックエンド {selected.backend_rate ? `${selected.backend_rate}%` : 'あり'}
                </span>
              )}
            </div>

            {selected.banner_url && (
              <img src={selected.banner_url} alt={selected.name} className="w-full rounded-lg mb-4 max-h-40 object-cover" />
            )}

            {selected.description && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">案件説明</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
              </div>
            )}

            {selected.appeal_points && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">アピールポイント</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.appeal_points}</p>
              </div>
            )}

            {selected.target_audience && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">対象ユーザー</h3>
                <p className="text-sm text-gray-600">{selected.target_audience}</p>
              </div>
            )}

            {selected.lp_url && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">LP URL</h3>
                <a href={selected.lp_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all">{selected.lp_url}</a>
              </div>
            )}

            {selected.notes && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <h3 className="text-xs font-semibold text-yellow-700 mb-1">注意事項</h3>
                <p className="text-sm text-yellow-600">{selected.notes}</p>
              </div>
            )}

            <div className="border-t pt-4">
              {!cid ? (
                <button onClick={generateLink} disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors">
                  {loading ? 'リンク生成中...' : 'アフィリエイトリンクを生成'}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">アフィリエイトリンク</label>
                  <div className="flex gap-2">
                    <input readOnly value={affiliateUrl}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50" />
                    <button onClick={copyLink}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        copied ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}>
                      {copied ? '✓ コピー済' : 'コピー'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">このURLを拡散してください。LINEユーザーが登録するたびに報酬が発生します。</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">←</div>
            <p className="text-sm">左から案件を選択してください</p>
          </div>
        )}
      </div>
    </div>
  )
}
