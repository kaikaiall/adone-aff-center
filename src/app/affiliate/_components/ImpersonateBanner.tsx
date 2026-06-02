'use client'
import { useState } from 'react'

interface ImpersonateBannerProps {
  isImpersonating: boolean
}

/**
 * 管理者がアフィリエイターになりすましている時に表示するバナー。
 * 「管理者に戻る」ボタンでセッションをクリアして管理画面へ戻る。
 */
export default function ImpersonateBanner({ isImpersonating }: ImpersonateBannerProps) {
  const [loading, setLoading] = useState(false)

  if (!isImpersonating) return null

  const handleReturn = async () => {
    setLoading(true)
    try {
      await fetch('/api/admin/impersonate', { method: 'DELETE' })
      // 管理者画面に戻る（フルリロードでセッション反映）
      window.location.href = '/admin/affiliates'
    } catch (err) {
      console.error('Return to admin error:', err)
      alert('管理者画面への復帰に失敗しました。手動でログインしてください。')
      setLoading(false)
    }
  }

  return (
    <div className="bg-yellow-100 border-b-2 border-yellow-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 text-yellow-900">
        <span>⚠️</span>
        <span className="font-medium">管理者として動作確認中</span>
        <span className="text-xs text-yellow-700 hidden sm:inline">
          （このアフィリエイターのアカウントとして閲覧しています）
        </span>
      </div>
      <button
        type="button"
        onClick={handleReturn}
        disabled={loading}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
      >
        {loading ? '戻る中…' : '← 管理者に戻る'}
      </button>
    </div>
  )
}
