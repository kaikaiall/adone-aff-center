'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BackendForm({ affiliates, offers }: { affiliates: any[], offers: any[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ affiliate_id: '', offer_id: '', count: '1', amount: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/backend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, count: Number(form.count), amount: Number(form.amount) }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg('保存しました')
      setForm({ affiliate_id: '', offer_id: '', count: '1', amount: '', note: '' })
      router.refresh()
      // revalidatePath をサーバー側で呼んでいるが、念のためクライアント側でも再フェッチ
      setTimeout(() => router.refresh(), 300)
    } else {
      const d = await res.json()
      setMsg('エラー: ' + d.error)
    }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {msg && <div className={`p-2 rounded text-sm ${msg.startsWith('エラー') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">アフィリエイター *</label>
        <select required value={form.affiliate_id} onChange={e => set('affiliate_id', e.target.value)} className={cls}>
          <option value="">選択してください</option>
          {affiliates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">案件 *</label>
        <select required value={form.offer_id} onChange={e => set('offer_id', e.target.value)} className={cls}>
          <option value="">選択してください</option>
          {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">件数</label>
          <input required type="number" min="1" value={form.count} onChange={e => set('count', e.target.value)} className={cls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）*</label>
          <input required type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} className={cls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
        <input type="text" value={form.note} onChange={e => set('note', e.target.value)} className={cls} />
      </div>
      <button type="submit" disabled={saving} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
        {saving ? '保存中...' : '報酬を追加'}
      </button>
    </form>
  )
}
