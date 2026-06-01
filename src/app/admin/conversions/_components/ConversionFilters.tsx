'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  affiliates: { id: string; name: string }[]
  offers: { id: string; name: string }[]
  currentFilters: {
    affiliate_id: string
    offer_id: string
    date_from: string
    date_to: string
    status: string
  }
  tab?: string
}

export default function ConversionFilters({ affiliates, offers, currentFilters, tab }: Props) {
  const [filters, setFilters] = useState(currentFilters)
  const [collapsed, setCollapsed] = useState(true)
  const router = useRouter()

  const set = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }))

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (tab) params.set('tab', tab)
    if (filters.status) params.set('status', filters.status)
    if (filters.affiliate_id) params.set('affiliate_id', filters.affiliate_id)
    if (filters.offer_id) params.set('offer_id', filters.offer_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    router.push(`/admin/conversions?${params.toString()}`)
  }

  const resetFilters = () => {
    setFilters({ affiliate_id: '', offer_id: '', date_from: '', date_to: '', status: '' })
    router.push(tab ? `/admin/conversions?tab=${tab}` : '/admin/conversions')
  }

  const hasFilter = Object.values(filters).some(v => v !== '')
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      {/* モバイル: 折りたたみヘッダー */}
      <div
        className="flex items-center justify-between cursor-pointer md:hidden"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-sm font-medium text-gray-700">
          絞り込み {hasFilter && <span className="text-green-600 text-xs ml-1">●適用中</span>}
        </span>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* フィルター本体 */}
      <div className={`${collapsed ? 'hidden' : 'block'} md:block`}>
        <div className="mt-3 md:mt-0 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 items-end">
          <div className="w-full lg:w-auto">
            <label className="block text-xs text-gray-500 mb-1">アフィリエイター</label>
            <select value={filters.affiliate_id} onChange={e => set('affiliate_id', e.target.value)} className={cls}>
              <option value="">全員</option>
              {affiliates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-xs text-gray-500 mb-1">案件</label>
            <select value={filters.offer_id} onChange={e => set('offer_id', e.target.value)} className={cls}>
              <option value="">全案件</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-xs text-gray-500 mb-1">開始日</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={e => set('date_from', e.target.value)}
              className={cls}
            />
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-xs text-gray-500 mb-1">終了日</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={e => set('date_to', e.target.value)}
              className={cls}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 lg:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm rounded-lg font-medium transition-colors"
            >
              絞り込み
            </button>
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="flex-1 lg:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg font-medium transition-colors"
              >
                リセット
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
