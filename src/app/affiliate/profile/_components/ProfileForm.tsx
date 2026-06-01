'use client'
import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

export default function ProfileForm({ affiliate }: { affiliate: Affiliate }) {
  const [form, setForm] = useState({
    name: affiliate.name || '',
    email: affiliate.email || '',
    phone: affiliate.phone || '',
    bank_name: affiliate.bank_name || '',
    bank_branch: affiliate.bank_branch || '',
    bank_account_type: affiliate.bank_account_type || '普通',
    bank_account_number: affiliate.bank_account_number || '',
    bank_account_holder: affiliate.bank_account_holder || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/affiliate/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setMsg('保存しました')
      setTimeout(() => setMsg(''), 3000)
    } else {
      const d = await res.json()
      setMsg('エラー: ' + d.error)
    }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
  const label = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.startsWith('エラー') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-500 uppercase">基本情報</h3>
      <div>
        <label className={label}>名前 *</label>
        <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className={cls} />
      </div>
      <div>
        <label className={label}>メールアドレス *</label>
        <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={cls} />
      </div>
      <div>
        <label className={label}>電話番号</label>
        <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={cls} placeholder="090-0000-0000" />
      </div>

      <hr />
      <h3 className="text-sm font-semibold text-gray-500 uppercase">口座情報（振込先）</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>銀行名</label>
          <input type="text" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className={cls} placeholder="三菱UFJ銀行" />
        </div>
        <div>
          <label className={label}>支店名</label>
          <input type="text" value={form.bank_branch} onChange={e => set('bank_branch', e.target.value)} className={cls} placeholder="渋谷支店" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>口座種別</label>
          <select value={form.bank_account_type} onChange={e => set('bank_account_type', e.target.value)} className={cls}>
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div>
          <label className={label}>口座番号</label>
          <input type="text" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} className={cls} placeholder="1234567" />
        </div>
      </div>
      <div>
        <label className={label}>口座名義（カタカナ）</label>
        <input type="text" value={form.bank_account_holder} onChange={e => set('bank_account_holder', e.target.value)} className={cls} placeholder="タナカ タロウ" />
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
        {saving ? '保存中...' : '保存する'}
      </button>
    </form>
  )
}
