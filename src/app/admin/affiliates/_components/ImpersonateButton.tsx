'use client'
import { useState } from 'react'

interface ImpersonateButtonProps {
  affiliateId: string
  affiliateName: string
}

export default function ImpersonateButton({ affiliateId, affiliateName }: ImpersonateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleImpersonate = async () => {
    const confirmed = window.confirm(
      `${affiliateName}としてアフィリエイター画面にログインします。\n\n` +
      `この操作はセキュリティ監査ログに記録されます。\n` +
      `本人のパスワードは変更されません。\n\n` +
      `続行しますか？`,
    )
    if (!confirmed) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'なりすましログインに失敗しました')
        setLoading(false)
        return
      }

      // 成功 → アフィリエイターダッシュボードへ
      window.location.href = '/affiliate/dashboard'
    } catch (err) {
      console.error('Impersonate error:', err)
      alert('通信エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleImpersonate}
      disabled={loading}
      title={`${affiliateName}としてアフィリエイター画面にログイン`}
      className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? '...' : '🔓 動作確認'}
    </button>
  )
}
