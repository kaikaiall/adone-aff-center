import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import OfferRowActions from './_components/OfferRowActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminOffersPage() {
  console.log('[AdminOffersPage] Fetching offers...')

  const { data: offers, error } = await supabaseAdmin
    .from('offers')
    .select('id, name, optin_price, has_backend, backend_rate, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[AdminOffersPage] Error:', error)
  }

  console.log('[AdminOffersPage] Found:', offers?.length, 'offers, ids:', offers?.map(o => o.id))

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">案件管理</h1>
        <Link href="/admin/offers/new" className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-colors">
          + 新規作成
        </Link>
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">案件名</th>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">単価</th>
              <th className="px-4 py-3 text-left">バックエンド</th>
              <th className="px-4 py-3 text-left">状態</th>
              <th className="px-4 py-3 text-left">作成日</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {(offers || []).map((offer: any) => (
              <tr key={offer.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{offer.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{offer.id}</td>
                <td className="px-4 py-3 text-green-600 font-medium">¥{offer.optin_price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {offer.has_backend
                    ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">あり</span>
                    : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">なし</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {offer.is_active
                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">公開中</span>
                    : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">非公開</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(offer.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-3">
                  <OfferRowActions offerId={offer.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!offers || offers.length === 0) && (
          <div className="text-center py-12 text-gray-400">案件がありません</div>
        )}
      </div>

      {/* モバイル: カード */}
      <div className="md:hidden space-y-3">
        {(offers || []).map((offer: any) => (
          <div key={offer.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-800">{offer.name}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{offer.id}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {offer.is_active
                  ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">公開中</span>
                  : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">非公開</span>
                }
                {offer.has_backend
                  ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">BE:あり</span>
                  : null
                }
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-bold">¥{offer.optin_price.toLocaleString()}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{new Date(offer.created_at).toLocaleDateString('ja-JP')}</span>
                <OfferRowActions offerId={offer.id} />
              </div>
            </div>
          </div>
        ))}
        {(!offers || offers.length === 0) && (
          <div className="text-center py-12 text-gray-400">案件がありません</div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400 text-right">{(offers || []).length}件</div>
    </div>
  )
}
