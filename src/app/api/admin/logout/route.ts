import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const url = new URL('/admin/login', request.url)
  const res = Response.redirect(url, 302)
  const headers = new Headers(res.headers)
  headers.append('Set-Cookie', 'admin_auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  headers.append('Set-Cookie', 'admin_impersonating=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  return new Response(null, { status: 302, headers })
}
