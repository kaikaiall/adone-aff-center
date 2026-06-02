import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail
    console.log('[Affiliate Login] Attempt:', email)

    if (!email || !password) {
      return Response.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
    }

    const { data: affiliate, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, is_active')
      .eq('email', email)
      .eq('password_hash', password)
      .maybeSingle()

    if (error) {
      console.error('[Affiliate Login] DB error:', error)
      throw error
    }

    if (!affiliate) {
      console.log('[Affiliate Login] Not found:', email)
      return Response.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
    }

    if (!affiliate.is_active) {
      return Response.json({ error: 'このアカウントは無効化されています' }, { status: 403 })
    }

    console.log('[Affiliate Login] Success:', affiliate.id)
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `affiliate_session=${affiliate.id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
    )
    headers.append('Set-Cookie', 'admin_impersonating=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
    return new Response(JSON.stringify({ ok: true, name: affiliate.name }), { status: 200, headers })
  } catch (error) {
    console.error('[Affiliate Login Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
