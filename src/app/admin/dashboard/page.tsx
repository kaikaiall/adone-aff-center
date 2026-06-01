import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboard() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalOffers },
    { count: totalAffiliates },
    { data: monthConversions },
    { data: monthBackend },
    { data: recentConversions },
  ] = await Promise.all([
    supabaseAdmin.from('offers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('affiliates').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('conversions').select('offer_id, status, offers(optin_price)').gte('created_at', monthStart),
    supabaseAdmin.from('conversions_backend').select('amount, status').gte('created_at', monthStart),
    supabaseAdmin
      .from('conversions')
      .select('*, affiliates(name), offers(name, optin_price)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const approvedConversions = (monthConversions || []).filter((c: any) => c.status === 'approved')
  const monthOptinRevenue = approvedConversions.reduce((sum: number, c: any) => sum + (c.offers?.optin_price || 0), 0)
  const monthBackendRevenue = (monthBackend || [])
    .filter((r: any) => r.status === 'approved')
    .reduce((sum: number, r: any) => sum + r.amount, 0)

  const statusLabel: Record<string, string> = { approved: '承認済', rejected: '却下', pending: '保留' }
  const statusColor: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">ダッシュボード</h1>

      {/* KPI カード：スマホ2列、デスクトップ5列 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 md:mb-8">
        <div className="bg-green-500 text-white rounded-xl p-4">
          <div className="text-xl md:text-2xl font-bold">{approvedConversions.length}件</div>
          <div className="text-xs mt-1 opacity-80">今月のオプトイン成果</div>
        </div>
        <div className="bg-emerald-500 text-white rounded-xl p-4">
          <div className="text-xl md:text-2xl font-bold">¥{monthOptinRevenue.toLocaleString()}</div>
          <div className="text-xs mt-1 opacity-80">今月のオプトイン報酬</div>
        </div>
        <div className="bg-blue-500 text-white rounded-xl p-4">
          <div className="text-xl md:text-2xl font-bold">¥{monthBackendRevenue.toLocaleString()}</div>
          <div className="text-xs mt-1 opacity-80">今月のバックエンド報酬</div>
        </div>
        <div className="bg-purple-500 text-white rounded-xl p-4">
          <div className="text-xl md:text-2xl font-bold">{(totalOffers ?? 0)}件</div>
          <div className="text-xs mt-1 opacity-80">案件数（有効）</div>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-xl md:text-2xl font-bold">{(totalAffiliates ?? 0)}人</div>
          <div className="text-xs mt-1 opacity-80">アフィリエイター数</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-700">最近の成果</h2>
          <Link href="/admin/conversions" className="text-sm text-blue-600 hover:underline">すべて見る →</Link>
        </div>

        {/* デスクトップ: テーブル表示 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b text-xs uppercase">
                <th className="pb-2">日時</th>
                <th className="pb-2">アフィリエイター</th>
                <th className="pb-2">案件</th>
                <th className="pb-2">表示名</th>
                <th className="pb-2">報酬</th>
                <th className="pb-2">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {(recentConversions || []).map((c: any) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 text-gray-400 text-xs">{new Date(c.created_at).toLocaleString('ja-JP')}</td>
                  <td className="py-2">{c.affiliates?.name}</td>
                  <td className="py-2">{c.offers?.name}</td>
                  <td className="py-2 text-gray-500">{c.display_name || '-'}</td>
                  <td className="py-2 font-medium">¥{(c.offers?.optin_price || 0).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイル: カード表示 */}
        <div className="md:hidden space-y-3">
          {(recentConversions || []).map((c: any) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium">{c.affiliates?.name}</div>
                  <div className="text-xs text-gray-500">{c.offers?.name}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-500'}`}>
                  {statusLabel[c.status] || c.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{new Date(c.created_at).toLocaleString('ja-JP')}</span>
                <span className="font-medium text-gray-700">¥{(c.offers?.optin_price || 0).toLocaleString()}</span>
              </div>
              {c.display_name && (
                <div className="text-xs text-gray-400 mt-1">LINE: {c.display_name}</div>
              )}
            </div>
          ))}
        </div>

        {(!recentConversions || recentConversions.length === 0) && (
          <p className="text-center text-gray-400 py-8">成果データがありません</p>
        )}
      </div>
    </div>
  )
}
