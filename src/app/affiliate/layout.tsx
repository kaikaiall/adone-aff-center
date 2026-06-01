'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/affiliate/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/affiliate/links', label: 'リンク取得', icon: '🔗' },
  { href: '/affiliate/profile', label: 'プロフィール', icon: '👤' },
]

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* デスクトップ用トップナビ */}
      <nav className="bg-green-600 text-white px-6 py-3 hidden md:flex items-center justify-between shadow">
        <Link href="/affiliate/dashboard" className="font-bold text-base">ADone</Link>
        <div className="flex gap-5 text-sm">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:text-green-200 transition-colors ${pathname.startsWith(item.href) ? 'text-white font-semibold' : 'text-green-100'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <form action="/api/affiliate/logout" method="POST">
          <button type="submit" className="text-sm text-green-200 hover:text-white transition-colors">ログアウト</button>
        </form>
      </nav>

      {/* モバイル用トップバー */}
      <header className="md:hidden bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow sticky top-0 z-10">
        <Link href="/affiliate/dashboard" className="font-bold text-base">ADone</Link>
        <div className="flex items-center gap-3">
          <form action="/api/affiliate/logout" method="POST">
            <button type="submit" className="text-xs text-green-200 hover:text-white transition-colors">ログアウト</button>
          </form>
        </div>
      </header>

      <main className="p-4 md:p-6">{children}</main>

      {/* モバイル用ボトムタブバー */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 safe-area-inset-bottom">
        <div className="flex">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 pt-2.5 text-xs transition-colors ${
                  active ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
