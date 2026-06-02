'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AffiliateSignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    invitationCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません')
      return
    }

    if (form.password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          invitationCode: form.invitationCode,
        }),
      })

      if (res.ok) {
        // 登録成功 → 自動ログイン → ダッシュボードへ
        router.push('/affiliate/dashboard')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || '登録に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-xl font-bold">L</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">ADone</h1>
        <p className="text-gray-400 text-sm text-center mb-6">アフィリエイター新規登録</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>お名前</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label className={labelClass}>メールアドレス</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="mail@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>パスワード（8文字以上）</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>パスワード（確認）</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.passwordConfirm}
              onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>招待コード</label>
            <input
              type="text"
              required
              value={form.invitationCode}
              onChange={e => setForm({ ...form, invitationCode: e.target.value })}
              className={inputClass}
              placeholder="管理者から共有されたコード"
            />
            <p className="text-xs text-gray-400 mt-1">
              ※ 招待コードがない方は管理者にお問い合わせください
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-5 space-y-2">
          <p>
            既にアカウントをお持ちの方は{' '}
            <Link href="/affiliate/login" className="text-green-600 hover:underline">
              ログイン
            </Link>
          </p>
          <Link href="/" className="text-gray-400 hover:text-gray-600 inline-block">
            ← トップへ
          </Link>
        </div>
      </div>
    </div>
  )
}
