'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  record: any
  affiliates: { id: string; name: string }[]
  offers: { id: string; name: string }[]
}

export default function BackendActions({ record, affiliates, offers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    affiliate_id: record.affiliate_id,
    offer_id: record.offer_id,
    count: String(record.count),
    amount: String(record.amount),
    note: record.note || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    const res = await fetch(`/api/admin/backend/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, count: Number(form.count), amount: Number(form.amount) }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg('保存しました')
      setTimeout(() => {
        setShowModal(false)
        setMsg('')
        startTransition(() => router.refresh())
      }, 800)
    } else {
      const d = await res.json()
      setMsg('エラー: ' + d.error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この報酬データを削除しますか？')) return
    const res = await fetch(`/api/admin/backend/${record.id}`, { method: 'DELETE' })
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      alert('削除に失敗しました')
    }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <>
      <div className="flex gap-1">
        <button
          onClick={() => setShowModal(true)}
          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          削除
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">バックエンド報酬を編集</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {msg && (
              <div className={`p-2 rounded text-sm mb-3 ${msg.startsWith('エラー') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {msg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アフィリエイター *</label>
                <select value={form.affiliate_id} onChange={e => set('affiliate_id', e.target.value)} className={cls}>
                  {affiliates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">案件 *</label>
                <select value={form.offer_id} onChange={e => set('offer_id', e.target.value)} className={cls}>
                  {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">件数</label>
                  <input type="number" min="1" value={form.count} onChange={e => set('count', e.target.value)} className={cls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）*</label>
                  <input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} className={cls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <input type="text" value={form.note} onChange={e => set('note', e.target.value)} className={cls} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
