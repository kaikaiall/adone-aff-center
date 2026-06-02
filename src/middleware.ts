import { NextRequest, NextResponse } from 'next/server'

const unauthorizedJson = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // --- 管理者 API ルート保護 ---
  if (pathname.startsWith('/api/admin/')) {
    // login / logout は認証不要
    if (
      pathname === '/api/admin/login' ||
      pathname === '/api/admin/logout'
    ) {
      return NextResponse.next()
    }
    const adminAuth = req.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return unauthorizedJson()
    }
  }

  // --- アフィリエイター API ルート保護 ---
  if (pathname.startsWith('/api/affiliate/')) {
    // login / signup は認証不要
    if (
      pathname === '/api/affiliate/login' ||
      pathname === '/api/affiliate/signup'
    ) {
      return NextResponse.next()
    }
    const session = req.cookies.get('affiliate_session')?.value
    if (!session) {
      return unauthorizedJson()
    }
  }

  // --- 管理者画面ルート保護（ログインページを除く）---
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminAuth = req.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // --- アフィリエイター画面ルート保護（ログイン・新規登録ページを除く）---
  if (
    pathname.startsWith('/affiliate') &&
    !pathname.startsWith('/affiliate/login') &&
    !pathname.startsWith('/affiliate/signup')
  ) {
    const session = req.cookies.get('affiliate_session')?.value
    if (!session) {
      return NextResponse.redirect(new URL('/affiliate/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/affiliate/:path*',
    '/api/admin/:path*',
    '/api/affiliate/:path*',
  ],
}
