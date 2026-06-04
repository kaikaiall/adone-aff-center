'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const statusColor: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  deleted: 'bg-gray-100 text-gray-500',
}
const statusLabel: Record<string, string> = {
  approved: '承認済',
  rejected: '却下',
  pending: '保留',
  deleted: '削除済',
}

export default function ConversionRow({ conversion }: { conversion: any }) {
  const [localStatus, setLocalStatus] = useState<string>(conversion.status)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const updateStatus = async (newStatus: string) => {
    setLocalStatus(newStatus)
    const res = await fetch(`/api/admin/conversions/${conversion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setLocalStatus(conversion.status)
      alert('更新に失敗しました')
      return
    }
    startTransition(() => { router.refresh() })
  }

  const ActionButtons = () => (
    <>
      {isPending ? (
        <span className="text-xs text-gray-400">更新中...</span>
      ) : (
        <div className="flex gap-1 flex-wrap">
          {localStatus !== 'approved' && localStatus !== 'deleted' && (
            <button onClick={() => updateStatus('approved')}
              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors">
              ✓承認
            </button>
          )}
          {localStatus !== 'rejected' && localStatus !== 'deleted' && (
            <button onClick={() => updateStatus('rejected')}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors">
              ✕却下
            </button>
          )}
          {localStatus !== 'pending' && localStatus !== 'deleted' && (
            <button onClick={() => updateStatus('pending')}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition-colors">
              ⏸保留
            </button>
          )}
          {localStatus !== 'deleted' && (
            <button onClick={() => {
              if (confirm('この成果を削除しますか？')) updateStatus('deleted')
            }}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded transition-colors">
              🗑削除
            </button>
          )}
          {localStatus === 'deleted' && (
            <button onClick={() => updateStatus('pending')}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded transition-colors">
              ↩復元
            </button>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      {/* デスクトップ: テーブル行 */}
      <tr className={`border-t hover:bg-gray-50 hidden md:table-row ${localStatus === 'deleted' ? 'opacity-50' : ''}`}>
        <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap">
          {new Date(conversion.created_at).toLocaleString('ja-JP')}
        </td>
        <td className="px-4 py-2">{conversion.affiliates?.name}</td>
        <td className="px-4 py-2">{conversion.offers?.name}</td>
        <td className="px-4 py-2">{conversion.display_name || '-'}</td>
        <td className="px-4 py-2 text-xs text-gray-400 font-mono max-w-[120px] truncate">{conversion.line_user_id}</td>
        <td className="px-4 py-2 text-xs text-gray-400">{conversion.source || '-'}</td>
        {/* TODO(Phase 4): スナップショット方式に対応（amount 優先、補完前フォールバックとして optin_price を維持） */}
        <td className="px-4 py-2 font-medium">¥{((conversion.amount && conversion.amount > 0) ? conversion.amount : (conversion.offers?.optin_price || 0)).toLocaleString()}</td>
        <td className="px-4 py-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[localStatus] || statusColor.pending}`}>
            {statusLabel[localStatus] || localStatus}
          </span>
        </td>
        <td className="px-4 py-2">
          <ActionButtons />
        </td>
      </tr>

      {/* モバイル: カード（tbody内に擬似カードとしてtr使用） */}
      <tr className={`md:hidden border-t ${localStatus === 'deleted' ? 'opacity-50' : ''}`}>
        <td colSpan={9} className="px-3 py-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">{conversion.affiliates?.name}</div>
                <div className="text-xs text-gray-500">{conversion.offers?.name}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${statusColor[localStatus] || statusColor.pending}`}>
                {statusLabel[localStatus] || localStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{new Date(conversion.created_at).toLocaleString('ja-JP')}</span>
              <span className="font-medium text-gray-700">¥{((conversion.amount && conversion.amount > 0) ? conversion.amount : (conversion.offers?.optin_price || 0)).toLocaleString()}</span>
            </div>
            {(conversion.display_name || conversion.line_user_id) && (
              <div className="text-xs text-gray-400">
                {conversion.display_name && <span>LINE: {conversion.display_name}</span>}
              </div>
            )}
            <div className="pt-1">
              <ActionButtons />
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}
