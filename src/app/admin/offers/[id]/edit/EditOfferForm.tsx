'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditOfferForm({ offer }: { offer: any }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: offer.name || '',
    optin_price: String(offer.optin_price || 0),
    has_backend: offer.has_backend || false,
    is_active: offer.is_active ?? true,
    description: offer.description || '',
    banner_url: offer.banner_url || '',
    lp_url: offer.lp_url || '',
    line_add_url: offer.line_add_url || '',
    appeal_points: offer.appeal_points || '',
    target_audience: offer.target_audience || '',
    notes: offer.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        optin_price: parseInt(form.optin_price) || 0,
      }),
    })
    const data = await res.json()
    console.log('[EditOfferForm] PATCH result:', data)
    setSaving(false)
    router.push('/admin/offers')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">案件名 *</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">オプトイン単価（円）</label>
          <input
            type="number"
            value={form.optin_price}
            onChange={(e) => setForm({ ...form, optin_price: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">バックエンド報酬</label>
          <select
            value={form.has_backend ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, has_backend: e.target.value === 'true' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="false">なし</option>
            <option value="true">あり</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">公開状態</label>
        <select
          value={form.is_active ? 'true' : 'false'}
          onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="true">公開中</option>
          <option value="false">非公開</option>
        </select>
      </div>
      <hr />
      <h2 className="text-lg font-semibold text-gray-700">案件詳細ページ設定</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">案件説明</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">バナー画像URL</label>
        <input
          type="url"
          value={form.banner_url}
          onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">LP URL</label>
        <input
          type="url"
          value={form.lp_url}
          onChange={(e) => setForm({ ...form, lp_url: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">LINE 友だち追加 URL</label>
        <input
          type="url"
          value={form.line_add_url}
          onChange={(e) => setForm({ ...form, line_add_url: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">訴求ポイント</label>
        <textarea
          rows={3}
          value={form.appeal_points}
          onChange={(e) => setForm({ ...form, appeal_points: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">対象ユーザー</label>
        <input
          type="text"
          value={form.target_audience}
          onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">注意事項</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <a href="/admin/offers" className="flex-1 text-center border border-gray-300 hover:bg-gray-50 py-2 rounded-lg font-medium">
          キャンセル
        </a>
      </div>
    </form>
  )
}
