'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  affiliate: {
    id: string
    name: string
    email: string
    phone: string | null
    bank_name: string | null
    bank_branch: string | null
    bank_account_type: string | null
    bank_account_number: string | null
    bank_account_holder: string | null
    is_active: boolean
  }
}

export default function AffiliateEditModal({ affiliate }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: affiliate.name || '',
    email: affiliate.email || '',
    password_hash: '', // 空=変更なし
    phone: affiliate.phone || '',
    bank_name: affiliate.bank_name || '',
    bank_branch: affiliate.bank_branch || '',
    bank_account_type: affiliate.bank_account_type || '普通',
    bank_account_number: affiliate.bank_account_number || '',
    bank_account_holder: affiliate.bank_account_holder || '',
    is_active: affiliate.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('名前を入力してください')
    if (!form.email.trim()) return setError('メールアドレスを入力してください')

    setSaving(true)
    const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '更新に失敗しました')
      return
    }

    setOpen(false)
    router.refresh()
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
  const label = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError('') }}
        className="text-blue-600 hover:underline text-xs font-medium"
      >
        編集
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">アフィリエイター編集</h2>
                <p className="text-xs text-gray-400">ID: {affiliate.id}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              <div>
                <label className={label}>名前 *</label>
                <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className={cls} />
              </div>
              <div>
                <label className={label}>メールアドレス *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={cls} />
              </div>
              <div>
                <label className={label}>パスワード <span className="text-xs text-gray-400">（空欄=変更しない）</span></label>
                <input type="text" value={form.password_hash} onChange={e => set('password_hash', e.target.value)} className={cls} placeholder="変更する場合のみ入力" />
              </div>
              <div>
                <label className={label}>電話番号</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={cls} />
              </div>
              <div>
                <label className={label}>有効/無効</label>
                <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className={cls}>
                  <option value="true">有効</option>
                  <option value="false">無効</option>
                </select>
              </div>

              <hr />
              <p className="text-xs font-semibold text-gray-500 uppercase">口座情報</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>銀行名</label>
                  <input type="text" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className={cls} />
                </div>
                <div>
                  <label className={label}>支店名</label>
                  <input type="text" value={form.bank_branch} onChange={e => set('bank_branch', e.target.value)} className={cls} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>口座種別</label>
                  <select value={form.bank_account_type} onChange={e => set('bank_account_type', e.target.value)} className={cls}>
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>
                <div>
                  <label className={label}>口座番号</label>
                  <input type="text" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} className={cls} />
                </div>
              </div>
              <div>
                <label className={label}>口座名義（カタカナ）</label>
                <input type="text" value={form.bank_account_holder} onChange={e => set('bank_account_holder', e.target.value)} className={cls} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
                  {saving ? '更新中...' : '更新する'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors">
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
