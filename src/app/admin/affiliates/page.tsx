import { supabaseAdmin } from '@/lib/supabase'
import AffiliateRegisterButton from './_components/AffiliateRegisterButton'
import AffiliateEditModal from './_components/AffiliateEditModal'
import ImpersonateButton from './_components/ImpersonateButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAffiliatesPage() {
  const { data: affiliates, error } = await supabaseAdmin
    .from('affiliates')
    .select('id, name, email, phone, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) console.error('[AdminAffiliatesPage] Error:', error)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">アフィリエイター管理</h1>
        <AffiliateRegisterButton />
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">名前</th>
              <th className="px-4 py-3 text-left">メール</th>
              <th className="px-4 py-3 text-left">電話</th>
              <th className="px-4 py-3 text-left">銀行情報</th>
              <th className="px-4 py-3 text-left">状態</th>
              <th className="px-4 py-3 text-left">登録日</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {(affiliates || []).map((a: any) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{a.id}</td>
                <td className="px-4 py-2 font-medium">{a.name}</td>
                <td className="px-4 py-2 text-gray-600">{a.email}</td>
                <td className="px-4 py-2 text-gray-500">{a.phone || '-'}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  {a.bank_name
                    ? `${a.bank_name} ${a.bank_branch || ''} ${a.bank_account_type || ''} ${a.bank_account_number || ''}`
                    : '-'}
                </td>
                <td className="px-4 py-2">
                  {a.is_active
                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">有効</span>
                    : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">無効</span>
                  }
                </td>
                <td className="px-4 py-2 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AffiliateEditModal affiliate={a} />
                    {a.is_active && <ImpersonateButton affiliateId={a.id} affiliateName={a.name} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!affiliates || affiliates.length === 0) && (
          <div className="text-center py-12 text-gray-400">アフィリエイターがいません</div>
        )}
      </div>

      {/* モバイル: カード */}
      <div className="md:hidden space-y-3">
        {(affiliates || []).map((a: any) => (
          <div key={a.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-800">{a.name}</div>
                <div className="text-xs text-gray-400 font-mono">{a.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {a.is_active
                  ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">有効</span>
                  : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">無効</span>
                }
                <AffiliateEditModal affiliate={a} />
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <div>📧 {a.email}</div>
              {a.phone && <div>📞 {a.phone}</div>}
              {a.bank_name && (
                <div>🏦 {a.bank_name} {a.bank_branch} {a.bank_account_type} {a.bank_account_number}</div>
              )}
              <div className="text-gray-400">登録: {new Date(a.created_at).toLocaleDateString('ja-JP')}</div>
            </div>
            {a.is_active && (
              <div className="mt-2 pt-2 border-t">
                <ImpersonateButton affiliateId={a.id} affiliateName={a.name} />
              </div>
            )}
          </div>
        ))}
        {(!affiliates || affiliates.length === 0) && (
          <div className="text-center py-12 text-gray-400">アフィリエイターがいません</div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400 text-right">{(affiliates || []).length}人</div>
    </div>
  )
}
