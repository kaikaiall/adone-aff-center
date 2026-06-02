'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WebhookUrlPanel from './WebhookUrlPanel'

interface OfferFormProps {
  initialData?: Record<string, unknown>
  offerId?: string
}

const defaultForm = {
  name: '', optin_price: '', has_backend: false,
  description: '', banner_url: '', lp_url: '', line_add_url: '',
  appeal_points: '', target_audience: '', notes: '', is_active: true,
}

export default function OfferForm({ initialData, offerId }: OfferFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    ...defaultForm,
    ...initialData,
    optin_price: String(initialData?.optin_price ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const payload: Record<string, unknown> = {
        ...form,
        optin_price: parseInt(form.optin_price) || 0,
        backend_rate: null,
      }

      // デバッグログ：送信データを確認
      console.log('[OfferForm] 送信ペイロード:', JSON.stringify(payload, null, 2))

      const url = offerId ? `/api/admin/offers/${offerId}` : '/api/admin/offers'
      const method = offerId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()
      console.log('[OfferForm] APIレスポンス:', res.status, responseData)

      if (!res.ok) {
        setError(responseData.error || '保存に失敗しました')
        return
      }

      // 編集の場合は画面遷移せず保存完了メッセージを表示
      if (offerId) {
        // 保存されたデータでフォームを更新（DBの実際の値を反映）
        setForm({
          ...defaultForm,
          ...responseData,
          optin_price: String(responseData?.optin_price ?? ''),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 4000)
        router.refresh()
      } else {
        // 新規作成の場合は一覧へ
        router.push('/admin/offers')
        router.refresh()
      }
    } catch (err) {
      console.error('[OfferForm] エラー:', err)
      setError('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 md:p-6 space-y-5 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm font-medium">
          ✅ 保存しました
        </div>
      )}

      <div>
        <label className={labelClass}>案件名 *</label>
        <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>オプトイン単価（円）*</label>
          <input required type="number" min="0" value={form.optin_price} onChange={e => set('optin_price', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>公開状態</label>
          <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className={inputClass}>
            <option value="true">公開中</option>
            <option value="false">非公開</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>バックエンド報酬</label>
        <select value={form.has_backend ? 'true' : 'false'} onChange={e => set('has_backend', e.target.value === 'true')} className={inputClass}>
          <option value="false">なし</option>
          <option value="true">あり</option>
        </select>
      </div>

      <hr />
      <h3 className="text-sm font-semibold text-gray-600 uppercase">案件詳細ページ設定</h3>

      <div>
        <label className={labelClass}>案件説明</label>
        <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>アピールポイント</label>
        <textarea rows={3} value={form.appeal_points} onChange={e => set('appeal_points', e.target.value)} className={inputClass} placeholder="・高単価&#10;・高転換率" />
      </div>

      <div>
        <label className={labelClass}>対象ユーザー</label>
        <input type="text" value={form.target_audience} onChange={e => set('target_audience', e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>バナー画像 URL</label>
        <input type="text" value={form.banner_url} onChange={e => set('banner_url', e.target.value)} className={inputClass} placeholder="https://" />
      </div>

      <div>
        <label className={labelClass}>LP の URL</label>
        <input type="text" value={form.lp_url} onChange={e => set('lp_url', e.target.value)} className={inputClass} placeholder="https://" />
      </div>

      <div>
        <label className={labelClass}>LINE 友だち追加 URL</label>
        <input type="text" value={form.line_add_url} onChange={e => set('line_add_url', e.target.value)} className={inputClass} placeholder="https://line.me/R/ti/p/..." />
      </div>

      <div>
        <label className={labelClass}>注意事項</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputClass} />
      </div>

      {/* CRM連携Webhook URLパネル（編集時のみ表示） */}
      {offerId && <WebhookUrlPanel offerId={offerId} />}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
          {saving ? '保存中...' : '保存'}
        </button>
        <a href="/admin/offers" className="flex-1 text-center border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors">
          キャンセル
        </a>
      </div>
    </form>
  )
}
