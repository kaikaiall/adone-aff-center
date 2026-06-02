'use client'
import { useRouter } from 'next/navigation'

export default function OfferRowActions({ offerId }: { offerId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('この案件を非公開（アーカイブ）にしますか？関連する成果データは保持されます。')) return
    const res = await fetch(`/api/admin/offers/${offerId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else alert('削除に失敗しました')
  }

  return (
    <div className="flex gap-3 items-center">
      <a href={`/admin/offers/${offerId}/edit`} className="text-blue-600 hover:underline text-xs">編集</a>
      <button onClick={handleDelete} className="text-red-500 hover:underline text-xs">削除</button>
    </div>
  )
}
