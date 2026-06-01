'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditOfferForm({ offer }: { offer: any }) {
  const router = useRouter()
  const content = offer.content || {}
  const [form, setForm] = useState({
    name: offer.name,
    optin_price: String(offer.optin_price),
    has_backend: offer.has_backend,
    is_active: offer.is_active,
    content: {
      description: content.description || '',
      banner: content.banner || '',
      lp_url: content.lp_url || '',
      line_add_url: content.line_add_url || '',
      appeal_points: content.appeal_points || '',
      target_audience: content.target_audience || '',
      notes: content.notes || '',
    },
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/admin/offers/${offer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, optin_price: parseInt(form.optin_price) || 0 }),
    })
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
      {[
        { key: 'description', label: '案件説明', type: 'textarea', rows: 4 },
        { key: 'banner', label: 'バナー画像URL', type: 'url' },
        { key: 'lp_url', label: 'LP URL', type: 'url' },
        { key: 'line_add_url', label: 'LINE 友だち追加 URL', type: 'url' },
        { key: 'appeal_points', label: '訴求ポイント', type: 'textarea', rows: 3 },
        { key: 'target_audience', label: '対象ユーザー', type: 'text' },
        { key: 'notes', label: '注意事項', type: 'textarea', rows: 2 },
      ].map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              rows={field.rows}
              value={(form.content as any)[field.key]}
              onChange={(e) => setForm({ ...form, content: { ...form.content, [field.key]: e.target.value } })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          ) : (
            <input
              type={field.type}
              value={(form.content as any)[field.key]}
              onChange={(e) => setForm({ ...form, content: { ...form.content, [field.key]: e.target.value } })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
        </div>
      ))}
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
