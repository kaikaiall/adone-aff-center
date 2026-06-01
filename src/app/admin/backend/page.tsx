import { supabaseAdmin } from '@/lib/supabase'
import BackendForm from './_components/BackendForm'
import BackendActions from './_components/BackendActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminBackendPage() {
  const [
    { data: records, error: recordsError },
    { data: affiliates },
    { data: allOffers },
  ] = await Promise.all([
    supabaseAdmin.from('conversions_backend').select('*, affiliates(name), offers(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('affiliates').select('id, name').eq('is_active', true),
    supabaseAdmin.from('offers').select('id, name').eq('is_active', true).order('name'),
  ])

  if (recordsError) {
    console.error('[AdminBackendPage] Supabase error:', recordsError)
  }

  const seenIds = new Set<string>()
  const backendOffers = (allOffers || []).filter(o => {
    if (seenIds.has(o.id)) return false
    seenIds.add(o.id)
    return true
  })

  const totalAmount = (records || []).reduce((sum: number, r: any) => sum + r.amount, 0)

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">バックエンド報酬管理</h1>

      {/* 入力フォーム＋サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">報酬入力</h2>
          <BackendForm affiliates={affiliates || []} offers={backendOffers || []} />
        </div>
        <div className="bg-blue-50 rounded-xl p-4 md:p-6">
          <div className="text-sm text-blue-600 mb-1">バックエンド報酬合計</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-700">¥{totalAmount.toLocaleString()}</div>
          <div className="text-sm text-blue-400 mt-1">{(records || []).length}件</div>
        </div>
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">日付</th>
              <th className="px-4 py-3 text-left">アフィリエイター</th>
              <th className="px-4 py-3 text-left">案件</th>
              <th className="px-4 py-3 text-left">件数</th>
              <th className="px-4 py-3 text-left">金額</th>
              <th className="px-4 py-3 text-left">備考</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {(records || []).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-2">{r.affiliates?.name}</td>
                <td className="px-4 py-2">{r.offers?.name}</td>
                <td className="px-4 py-2">{r.count}件</td>
                <td className="px-4 py-2 font-medium text-blue-600">¥{r.amount.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-400">{r.note || '-'}</td>
                <td className="px-4 py-2">
                  <BackendActions
                    record={r}
                    affiliates={affiliates || []}
                    offers={backendOffers || []}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recordsError && (
          <div className="text-center py-8 text-red-400">データ取得エラー: {recordsError.message}</div>
        )}
        {!recordsError && (!records || records.length === 0) && (
          <div className="text-center py-8 text-gray-400">バックエンド報酬データがありません</div>
        )}
      </div>

      {/* モバイル: カード */}
      <div className="md:hidden space-y-3">
        {(records || []).map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-800">{r.affiliates?.name}</div>
                <div className="text-xs text-gray-500">{r.offers?.name}</div>
              </div>
              <span className="font-bold text-blue-600">¥{r.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
              <span>{r.count}件</span>
            </div>
            {r.note && <div className="text-xs text-gray-400 mt-1">備考: {r.note}</div>}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <BackendActions
                record={r}
                affiliates={affiliates || []}
                offers={backendOffers || []}
              />
            </div>
          </div>
        ))}
        {recordsError && (
          <div className="text-center py-8 text-red-400">データ取得エラー: {recordsError.message}</div>
        )}
        {!recordsError && (!records || records.length === 0) && (
          <div className="text-center py-8 text-gray-400">バックエンド報酬データがありません</div>
        )}
      </div>
    </div>
  )
}
