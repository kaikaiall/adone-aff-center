import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const url = new URL('/affiliate/login', request.url)
  const headers = new Headers()
  headers.set('Location', url.toString())
  headers.append('Set-Cookie', 'affiliate_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  headers.append('Set-Cookie', 'admin_impersonating=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  return new Response(null, { status: 302, headers })
}
