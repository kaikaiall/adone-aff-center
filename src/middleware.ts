import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 管理者エリア（ログインページを除く）
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminAuth = req.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // アフィリエイターエリア（ログインページを除く）
  if (pathname.startsWith('/affiliate') && !pathname.startsWith('/affiliate/login')) {
    const session = req.cookies.get('affiliate_session')?.value
    if (!session) {
      return NextResponse.redirect(new URL('/affiliate/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/affiliate/:path*'],
}
