import { supabaseAdmin } from '@/lib/supabase'
import ConversionRow from './_components/ConversionRow'
import ConversionFilters from './_components/ConversionFilters'
import BackendConversionRow from './_components/BackendConversionRow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminConversionsPage({
  searchParams,
}: {
  searchParams: {
    tab?: string
    status?: string
    affiliate_id?: string
    offer_id?: string
    date_from?: string
    date_to?: string
  }
}) {
  const isBackendTab = searchParams.tab === 'backend'

  // フィルター用の選択肢（両タブ共通）
  const [{ data: affiliates }, { data: offers }] = await Promise.all([
    supabaseAdmin.from('affiliates').select('id, name').eq('is_active', true).order('name'),
    supabaseAdmin.from('offers').select('id, name').order('name'),
  ])

  // 共通フィルターパラメータ（タブ・ステータス以外）
  const filterParams = new URLSearchParams()
  if (searchParams.affiliate_id) filterParams.set('affiliate_id', searchParams.affiliate_id)
  if (searchParams.offer_id) filterParams.set('offer_id', searchParams.offer_id)
  if (searchParams.date_from) filterParams.set('date_from', searchParams.date_from)
  if (searchParams.date_to) filterParams.set('date_to', searchParams.date_to)

  if (isBackendTab) {
    // ── バックエンドタブ ──
    let query = supabaseAdmin
      .from('conversions_backend')
      .select('*, affiliates(id, name), offers(id, name)')
      .order('created_at', { ascending: false })
      .limit(500) // M6対応：無制限取得防止（最新500件）

    if (searchParams.status) query = query.eq('status', searchParams.status)
    if (searchParams.affiliate_id) query = query.eq('affiliate_id', searchParams.affiliate_id)
    if (searchParams.offer_id) query = query.eq('offer_id', searchParams.offer_id)
    if (searchParams.date_from) query = query.gte('created_at', searchParams.date_from)
    if (searchParams.date_to) {
      const dateTo = new Date(searchParams.date_to)
      dateTo.setDate(dateTo.getDate() + 1)
      query = query.lt('created_at', dateTo.toISOString())
    }

    const { data: backendRecords } = await query
    const { data: allBackend } = await supabaseAdmin.from('conversions_backend').select('status')

    const counts = {
      all: (allBackend || []).length,
      pending: (allBackend || []).filter((r: any) => (r.status || 'pending') === 'pending').length,
      approved: (allBackend || []).filter((r: any) => r.status === 'approved').length,
      rejected: (allBackend || []).filter((r: any) => r.status === 'rejected').length,
      deleted: (allBackend || []).filter((r: any) => r.status === 'deleted').length,
    }

    const statusTabs = [
      { label: `全て (${counts.all})`, value: '' },
      { label: `保留 (${counts.pending})`, value: 'pending' },
      { label: `承認済 (${counts.approved})`, value: 'approved' },
      { label: `却下 (${counts.rejected})`, value: 'rejected' },
      { label: `削除 (${counts.deleted})`, value: 'deleted' },
    ]

    const all = backendRecords || []

    return (
      <div className="max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">成果一覧</h1>

        {/* メインタブ：オプトイン / バックエンド */}
        <div className="flex gap-2 mb-4">
          <a href={`/admin/conversions?${filterParams}`}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
            オプトイン
          </a>
          <a href={`/admin/conversions?tab=backend${filterParams.toString() ? '&' + filterParams : ''}`}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white transition-colors">
            バックエンド
          </a>
        </div>

        <ConversionFilters
          affiliates={affiliates || []}
          offers={offers || []}
          currentFilters={{
            affiliate_id: searchParams.affiliate_id || '',
            offer_id: searchParams.offer_id || '',
            date_from: searchParams.date_from || '',
            date_to: searchParams.date_to || '',
            status: searchParams.status || '',
          }}
          tab="backend"
        />

        {/* ステータスサブタブ */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {statusTabs.map(tab => {
            const params = new URLSearchParams(filterParams)
            params.set('tab', 'backend')
            if (tab.value) params.set('status', tab.value)
            return (
              <a key={tab.value} href={`/admin/conversions?${params}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (searchParams.status || '') === tab.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}>
                {tab.label}
              </a>
            )
          })}
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase hidden md:table-header-group">
              <tr>
                <th className="px-4 py-3 text-left">日時</th>
                <th className="px-4 py-3 text-left">アフィリエイター</th>
                <th className="px-4 py-3 text-left">案件</th>
                <th className="px-4 py-3 text-left">件数</th>
                <th className="px-4 py-3 text-left">金額</th>
                <th className="px-4 py-3 text-left">備考</th>
                <th className="px-4 py-3 text-left">ステータス</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r: any) => (
                <BackendConversionRow key={`${r.id}-${r.status}`} record={r} />
              ))}
            </tbody>
          </table>
          {all.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {Object.values(searchParams).some(Boolean) ? '条件に一致するバックエンド報酬がありません' : 'バックエンド報酬データがありません'}
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400 text-right">{all.length}件表示</div>
      </div>
    )
  }

  // ── オプトインタブ（デフォルト）──
  let query = supabaseAdmin
    .from('conversions')
    .select('*, affiliates(id, name), offers(id, name, optin_price)')
    .order('created_at', { ascending: false })
    .limit(500) // M6対応：無制限取得防止（最新500件）

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.affiliate_id) query = query.eq('affiliate_id', searchParams.affiliate_id)
  if (searchParams.offer_id) query = query.eq('offer_id', searchParams.offer_id)
  if (searchParams.date_from) query = query.gte('created_at', searchParams.date_from)
  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setDate(dateTo.getDate() + 1)
    query = query.lt('created_at', dateTo.toISOString())
  }

  const { data: conversions } = await query
  const { data: allForCount } = await supabaseAdmin.from('conversions').select('status')

  const counts = {
    all: (allForCount || []).length,
    pending: (allForCount || []).filter((c: any) => c.status === 'pending').length,
    approved: (allForCount || []).filter((c: any) => c.status === 'approved').length,
    rejected: (allForCount || []).filter((c: any) => c.status === 'rejected').length,
    deleted: (allForCount || []).filter((c: any) => c.status === 'deleted').length,
  }

  const all = conversions || []

  const statusTabs = [
    { label: `全て (${counts.all})`, value: '' },
    { label: `保留 (${counts.pending})`, value: 'pending' },
    { label: `承認済 (${counts.approved})`, value: 'approved' },
    { label: `却下 (${counts.rejected})`, value: 'rejected' },
    { label: `削除 (${counts.deleted})`, value: 'deleted' },
  ]

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">成果一覧</h1>

      {/* メインタブ：オプトイン / バックエンド */}
      <div className="flex gap-2 mb-4">
        <a href={`/admin/conversions?${filterParams}`}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white transition-colors">
          オプトイン
        </a>
        <a href={`/admin/conversions?tab=backend${filterParams.toString() ? '&' + filterParams : ''}`}
          className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
          バックエンド
        </a>
      </div>

      <ConversionFilters
        affiliates={affiliates || []}
        offers={offers || []}
        currentFilters={{
          affiliate_id: searchParams.affiliate_id || '',
          offer_id: searchParams.offer_id || '',
          date_from: searchParams.date_from || '',
          date_to: searchParams.date_to || '',
          status: searchParams.status || '',
        }}
      />

      {/* ステータスサブタブ */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statusTabs.map(tab => {
          const params = new URLSearchParams(filterParams)
          if (tab.value) params.set('status', tab.value)
          const href = params.toString() ? `/admin/conversions?${params}` : '/admin/conversions'
          return (
            <a key={tab.value} href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (searchParams.status || '') === tab.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {tab.label}
            </a>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left">日時</th>
              <th className="px-4 py-3 text-left">アフィリエイター</th>
              <th className="px-4 py-3 text-left">案件</th>
              <th className="px-4 py-3 text-left">LINE 表示名</th>
              <th className="px-4 py-3 text-left">LINE UID</th>
              <th className="px-4 py-3 text-left">流入元</th>
              <th className="px-4 py-3 text-left">報酬</th>
              <th className="px-4 py-3 text-left">ステータス</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {all.map((c: any) => (
              <ConversionRow key={`${c.id}-${c.status}`} conversion={c} />
            ))}
          </tbody>
        </table>
        {all.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {Object.values(searchParams).some(Boolean) ? '条件に一致する成果がありません' : '成果データがありません'}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 text-right">{all.length}件表示</div>
    </div>
  )
}
