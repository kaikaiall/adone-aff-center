export default function RedirectErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const reason = searchParams.reason

  const message =
    reason === 'no_destination'
      ? 'リダイレクト先が設定されていません。'
      : 'このリンクは無効です。'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
        {/* ADone ロゴ */}
        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-800">ADone</div>
          <div className="text-xs text-gray-400 mt-0.5">アフィリエイト管理プラットフォーム</div>
        </div>

        {/* エラーアイコン */}
        <div className="text-5xl mb-4">🔗</div>

        {/* エラーメッセージ */}
        <h1 className="text-lg font-bold text-gray-800 mb-2">リンクにアクセスできません</h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        {/* 案内 */}
        <div className="bg-gray-50 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-gray-600 mb-1">お心当たりがある場合</p>
          <p className="text-xs text-gray-500">
            このリンクを共有した担当者にお問い合わせください。
            リンクが期限切れまたは削除されている可能性があります。
          </p>
        </div>
      </div>
    </div>
  )
}
