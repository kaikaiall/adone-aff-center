import { supabaseAdmin } from '@/lib/supabase'
import { getAffiliateSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AffiliateFilters from './_components/AffiliateFilters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AffiliateDashboard({
  searchParams,
}: {
  searchParams: { offer_id?: string; date_from?: string; date_to?: string }
}) {
  const affiliate = await getAffiliateSession()
  if (!affiliate) redirect('/affiliate/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let query = supabaseAdmin
    .from('conversions')
    .select('*, offers(id, name, optin_price)')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (searchParams.offer_id) query = query.eq('offer_id', searchParams.offer_id)
  if (searchParams.date_from) query = query.gte('created_at', searchParams.date_from)
  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setDate(dateTo.getDate() + 1)
    query = query.lt('created_at', dateTo.toISOString())
  }

  const [{ data: conversions }, { data: backendRewards }, { data: myOffers }] = await Promise.all([
    query,
    supabaseAdmin
      .from('conversions_backend')
      .select('*, offers(id, name)')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('affiliate_links')
      .select('offer_id, offers(id, name)')
      .eq('affiliate_id', affiliate.id),
  ])

  const approved = conversions || []
  const monthApproved = approved.filter((c: any) => c.created_at >= monthStart)
  const optinTotal = approved.reduce((sum: number, c: any) => sum + (c.offers?.optin_price || 0), 0)
  const backendTotal = (backendRewards || []).reduce((sum: number, r: any) => sum + r.amount, 0)

  const offerMap: Record<string, string> = {}
  ;(myOffers || []).forEach((l: any) => {
    if (l.offer_id && l.offers?.name) offerMap[l.offer_id] = l.offers.name
  })
  const offerOptions = Object.entries(offerMap).map(([id, name]) => ({ id, name }))

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">ダッシュボード</h1>
      <p className="text-gray-400 text-sm mb-4 md:mb-6">ようこそ、{affiliate.name} さん</p>

      {/* KPI カード：スマホ1列、デスクトップ3列 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow p-4 md:p-5">
          <div className="text-xs text-gray-500 mb-1">今月の承認済み成果</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-800">{monthApproved.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 md:p-5">
          <div className="text-xs text-green-600 mb-1">オプトイン報酬合計</div>
          <div className="text-2xl md:text-3xl font-bold text-green-700">¥{optinTotal.toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 md:p-5">
          <div className="text-xs text-blue-600 mb-1">バックエンド報酬合計</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-700">¥{backendTotal.toLocaleString()}</div>
        </div>
      </div>

      <AffiliateFilters
        offers={offerOptions}
        currentFilters={{
          offer_id: searchParams.offer_id || '',
          date_from: searchParams.date_from || '',
          date_to: searchParams.date_to || '',
        }}
      />

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">承認済み成果一覧</h2>
          <span className="text-xs text-gray-400">{approved.length}件</span>
        </div>
        {approved.length > 0 ? (
          <>
            {/* デスクトップ: テーブル */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b uppercase">
                    <th className="pb-2">日時</th>
                    <th className="pb-2">案件</th>
                    <th className="pb-2">LINE 表示名</th>
                    <th className="pb-2">報酬</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 text-gray-400 text-xs">{new Date(c.created_at).toLocaleString('ja-JP')}</td>
                      <td className="py-2">{c.offers?.name}</td>
                      <td className="py-2 text-gray-500">{c.display_name || '-'}</td>
                      <td className="py-2 font-medium text-green-600">¥{(c.offers?.optin_price || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* モバイル: カード */}
            <div className="md:hidden space-y-2">
              {approved.map((c: any) => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.offers?.name}</span>
                    <span className="font-medium text-green-600 text-sm">¥{(c.offers?.optin_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(c.created_at).toLocaleString('ja-JP')}</span>
                    {c.display_name && <span>{c.display_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">
            {Object.values(searchParams).some(Boolean) ? '条件に一致する成果がありません' : '承認済み成果がまだありません'}
          </p>
        )}
      </div>

      {(backendRewards || []).length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">バックエンド報酬履歴</h2>
          {/* デスクトップ: テーブル */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b uppercase">
                  <th className="pb-2">日付</th>
                  <th className="pb-2">案件</th>
                  <th className="pb-2">件数</th>
                  <th className="pb-2">金額</th>
                </tr>
              </thead>
              <tbody>
                {(backendRewards || []).map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
                    <td className="py-2">{r.offers?.name}</td>
                    <td className="py-2">{r.count}件</td>
                    <td className="py-2 font-medium text-blue-600">¥{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* モバイル: カード */}
          <div className="md:hidden space-y-2">
            {(backendRewards || []).map((r: any) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.offers?.name}</span>
                  <span className="font-medium text-blue-600 text-sm">¥{r.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                  <span>{r.count}件</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
