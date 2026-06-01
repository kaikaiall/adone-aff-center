'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const defaultForm = {
  id: '', name: '', email: '', password_hash: '', phone: '',
  bank_name: '', bank_branch: '', bank_account_type: '普通',
  bank_account_number: '', bank_account_holder: '',
}

export default function AffiliateRegisterButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!form.id.trim()) return setError('IDを入力してください')
    if (!form.id.match(/^[a-zA-Z0-9_-]+$/)) return setError('IDは英数字・アンダースコア・ハイフンのみ使用可能です')
    if (!form.name.trim()) return setError('名前を入力してください')
    if (!form.email.trim()) return setError('メールアドレスを入力してください')
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('正しいメール形式で入力してください')
    if (!form.password_hash.trim()) return setError('パスワードを入力してください')
    if (form.password_hash.length < 6) return setError('パスワードは6文字以上で入力してください')

    setSaving(true)
    const res = await fetch('/api/admin/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, is_active: true }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      // 重複エラーを分かりやすく表示
      if (data.error?.includes('duplicate') || data.error?.includes('unique')) {
        setError('このIDまたはメールアドレスはすでに登録されています')
      } else {
        setError(data.error || '登録に失敗しました')
      }
      return
    }

    setForm(defaultForm)
    setOpen(false)
    router.refresh()
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
  const label = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(''); setForm(defaultForm) }}
        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        ＋ 新規登録
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">アフィリエイター新規登録</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ID * <span className="text-xs text-gray-400">例: aff_006</span></label>
                  <input required type="text" value={form.id} onChange={e => set('id', e.target.value)} className={cls} placeholder="aff_006" />
                </div>
                <div>
                  <label className={label}>名前 *</label>
                  <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className={cls} />
                </div>
              </div>

              <div>
                <label className={label}>メールアドレス *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={cls} />
              </div>

              <div>
                <label className={label}>パスワード * <span className="text-xs text-gray-400">6文字以上</span></label>
                <input required type="text" value={form.password_hash} onChange={e => set('password_hash', e.target.value)} className={cls} />
              </div>

              <div>
                <label className={label}>電話番号</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={cls} placeholder="090-0000-0000" />
              </div>

              <hr />
              <p className="text-xs font-semibold text-gray-500 uppercase">口座情報（任意）</p>

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
                  {saving ? '登録中...' : '登録する'}
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
