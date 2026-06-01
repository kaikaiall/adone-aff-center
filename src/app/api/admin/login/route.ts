import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

    if (!password || password !== adminPassword) {
      return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 })
    }

    const res = Response.json({ ok: true })
    const headers = new Headers(res.headers)
    headers.set(
      'Set-Cookie',
      `admin_auth=true; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`
    )
    return new Response(res.body, { status: 200, headers })
  } catch (error) {
    console.error('[Admin Login Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
