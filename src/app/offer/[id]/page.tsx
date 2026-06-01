import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { cid?: string }
}) {
  const { data: offer } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!offer) notFound()

  const content = offer.content || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {content.banner && (
          <img src={content.banner} alt={offer.name} className="w-full rounded-xl mb-6 shadow" />
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{offer.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              オプトイン報酬 ¥{offer.optin_price.toLocaleString()}
            </span>
            {offer.has_backend && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                バックエンドあり
              </span>
            )}
          </div>

          {content.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">案件説明</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{content.description}</p>
            </div>
          )}

          {content.appeal_points && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">訴求ポイント</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{content.appeal_points}</p>
            </div>
          )}

          {content.target_audience && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">対象ユーザー</h2>
              <p className="text-gray-700">{content.target_audience}</p>
            </div>
          )}

          {content.notes && (
            <div className="p-4 bg-yellow-50 rounded-lg mb-6">
              <h2 className="text-sm font-semibold text-yellow-700 mb-1">注意事項</h2>
              <p className="text-sm text-yellow-600">{content.notes}</p>
            </div>
          )}

          {content.lp_url && (
            <a
              href={content.lp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg transition-colors"
            >
              LPを見る →
            </a>
          )}
        </div>

        {searchParams.cid && (
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-xs text-gray-400">
              アフィリエイトリンク経由でのアクセス（cid: {searchParams.cid}）
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
