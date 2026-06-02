import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">L</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ADone</h1>
        <p className="text-gray-400 text-sm mb-8">LINEオプトインアフィリエイト管理プラットフォーム</p>
        <div className="space-y-3">
          <Link href="/affiliate/login"
            className="block w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors">
            アフィリエイターログイン
          </Link>
          <Link href="/admin/login"
            className="block w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors">
            管理者ログイン
          </Link>
        </div>
      </div>
    </div>
  )
}
