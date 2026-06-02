'use client'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/admin/offers', label: '案件管理', icon: '📋' },
  { href: '/admin/conversions', label: '成果一覧', icon: '✅' },
  { href: '/admin/backend', label: 'バックエンド報酬', icon: '💰' },
  { href: '/admin/affiliates', label: 'アフィリエイター', icon: '👥' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // ログイン画面はサイドバーなしのシンプルレイアウト
  if (pathname.startsWith('/admin/login')) {
    return <div className="min-h-screen bg-gray-100">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* オーバーレイ（モバイル時） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-56 bg-gray-900 text-white flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">ADone</div>
            <div className="text-sm font-bold">管理画面</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white text-xl p-1"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              ログアウト
            </button>
          </form>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* モバイル用トップバー */}
        <header className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white p-1 text-xl"
            aria-label="メニューを開く"
          >
            ☰
          </button>
          <span className="text-sm font-bold">ADone 管理画面</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
