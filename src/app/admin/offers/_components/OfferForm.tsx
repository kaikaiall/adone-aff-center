'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WebhookUrlPanel from './WebhookUrlPanel'

interface OfferFormProps {
  initialData?: Record<string, unknown>
  offerId?: string
  webhookSecret?: string
}

interface RateWithName {
  id: string
  affiliate_id: string
  affiliate_name: string
  offer_id: string
  custom_optin_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const defaultForm = {
  name: '', optin_price: '', has_backend: false,
  description: '', banner_url: '', lp_url: '', line_add_url: '',
  appeal_points: '', target_audience: '', notes: '', is_active: true,
}

export default function OfferForm({ initialData, offerId, webhookSecret }: OfferFormProps) {
  const router = useRouter()

  // ── 既存フォーム state（変更なし）──────────────────────────
  const [form, setForm] = useState({
    ...defaultForm,
    ...initialData,
    optin_price: String(initialData?.optin_price ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // ── 特別単価 state（既存から完全独立）──────────────────────
  const [rates, setRates] = useState<RateWithName[]>([])
  const [affiliates, setAffiliates] = useState<{ id: string; name: string }[]>([])
  const [rateForm, setRateForm] = useState({ affiliate_id: '', custom_optin_price: '' })
  const [rateError, setRateError] = useState('')
  const [rateSaving, setRateSaving] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState('')

  // 特別単価・アフィリエイター一覧をフェッチ（編集時のみ）
  useEffect(() => {
    if (!offerId) return

    const fetchData = async () => {
      const [ratesRes, affiliatesRes] = await Promise.all([
        fetch(`/api/admin/offers/${offerId}/rates`),
        fetch('/api/admin/affiliates'),
      ])
      if (ratesRes.ok) {
        const data: RateWithName[] = await ratesRes.json()
        setRates(data.filter(r => r.is_active))
      }
      if (affiliatesRes.ok) {
        const data: { id: string; name: string }[] = await affiliatesRes.json()
        setAffiliates(data)
      }
    }

    fetchData()
  }, [offerId])

  // ── 既存フォーム送信処理（変更なし）────────────────────────
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

      if (offerId) {
        setForm({
          ...defaultForm,
          ...responseData,
          optin_price: String(responseData?.optin_price ?? ''),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 4000)
        router.refresh()
      } else {
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

  // ── 特別単価：追加 ─────────────────────────────────────────
  const handleAddRate = async () => {
    if (!offerId) return
    setRateError('')
    if (!rateForm.affiliate_id) {
      setRateError('アフィリエイターを選択してください')
      return
    }
    const price = parseInt(rateForm.custom_optin_price)
    if (isNaN(price) || price < 0) {
      setRateError('単価は0以上の整数を入力してください')
      return
    }

    setRateSaving(true)
    try {
      const res = await fetch(`/api/admin/offers/${offerId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliate_id: rateForm.affiliate_id, custom_optin_price: price }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRateError(data.error || '追加に失敗しました')
        return
      }
      setRates(prev => [data, ...prev])
      setRateForm({ affiliate_id: '', custom_optin_price: '' })
    } catch {
      setRateError('通信エラーが発生しました')
    } finally {
      setRateSaving(false)
    }
  }

  // ── 特別単価：インライン編集保存 ───────────────────────────
  const handleSaveEdit = async (rateId: string) => {
    if (!offerId) return
    setRateError('')
    const price = parseInt(editingPrice)
    if (isNaN(price) || price < 0) {
      setRateError('単価は0以上の整数を入力してください')
      return
    }

    setRateSaving(true)
    try {
      const res = await fetch(`/api/admin/offers/${offerId}/rates/${rateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_optin_price: price }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRateError(data.error || '更新に失敗しました')
        return
      }
      setRates(prev =>
        prev.map(r => (r.id === rateId ? { ...r, custom_optin_price: price } : r))
      )
      setEditingRateId(null)
      setEditingPrice('')
    } catch {
      setRateError('通信エラーが発生しました')
    } finally {
      setRateSaving(false)
    }
  }

  // ── 特別単価：削除 ─────────────────────────────────────────
  const handleDeleteRate = async (rateId: string, affiliateName: string) => {
    if (!offerId) return
    if (!confirm(`${affiliateName} の特別単価を削除しますか？`)) return
    setRateError('')

    try {
      const res = await fetch(`/api/admin/offers/${offerId}/rates/${rateId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setRateError(data.error || '削除に失敗しました')
        return
      }
      setRates(prev => prev.filter(r => r.id !== rateId))
    } catch {
      setRateError('通信エラーが発生しました')
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

      {/* ── 既存フォームフィールド（変更なし）─────────────── */}
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
      {offerId && <WebhookUrlPanel offerId={offerId} webhookSecret={webhookSecret} />}

      {/* ── 特別単価セクション（編集時のみ表示）────────────── */}
      {offerId && (
        <div className="border-t pt-5">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">特別単価</h3>
          <p className="text-xs text-gray-500 mb-4">
            特別単価を設定したアフィリエイターには、案件のデフォルト単価ではなくここで設定した単価が適用されます。
          </p>

          {rateError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-3">{rateError}</div>
          )}

          {/* 追加フォーム */}
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div className="flex-1 min-w-[160px]">
              <label className={labelClass}>アフィリエイター</label>
              <select
                value={rateForm.affiliate_id}
                onChange={e => setRateForm(prev => ({ ...prev, affiliate_id: e.target.value }))}
                className={inputClass}
              >
                <option value="">選択してください</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>{a.name}（{a.id}）</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className={labelClass}>単価（円）</label>
              <input
                type="number"
                min="0"
                value={rateForm.custom_optin_price}
                onChange={e => setRateForm(prev => ({ ...prev, custom_optin_price: e.target.value }))}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <button
              type="button"
              onClick={handleAddRate}
              disabled={rateSaving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {rateSaving ? '追加中...' : '追加'}
            </button>
          </div>

          {/* 特別単価一覧 */}
          {rates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b uppercase">
                    <th className="pb-2">アフィリエイター</th>
                    <th className="pb-2">単価</th>
                    <th className="pb-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(rate => (
                    <tr key={rate.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <span className="font-medium">{rate.affiliate_name}</span>
                        <span className="text-xs text-gray-400 ml-1">（{rate.affiliate_id}）</span>
                      </td>
                      <td className="py-2 pr-4">
                        {editingRateId === rate.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editingPrice}
                            onChange={e => setEditingPrice(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-green-700">¥{rate.custom_optin_price.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {editingRateId === rate.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(rate.id)}
                                disabled={rateSaving}
                                className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors"
                              >
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingRateId(null); setEditingPrice('') }}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded transition-colors"
                              >
                                キャンセル
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRateId(rate.id)
                                  setEditingPrice(String(rate.custom_optin_price))
                                  setRateError('')
                                }}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded transition-colors"
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRate(rate.id, rate.affiliate_name)}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded transition-colors"
                              >
                                削除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              特別単価はまだ設定されていません
            </p>
          )}
        </div>
      )}

      {/* ── 保存・キャンセルボタン（変更なし）───────────────── */}
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
