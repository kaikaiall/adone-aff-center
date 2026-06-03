import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail
    console.log('[Affiliate Login] Attempt:', email)

    if (!email || !password) {
      return Response.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
    }

    // password_hash も取得してアプリ側で照合する（bcrypt グレースフル移行対応）
    const { data: affiliate, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, password_hash, is_active')
      .eq('email', email)
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

    // ─────────────────────────────────────────
    // パスワード照合（グレースフル移行）
    // bcryptハッシュ形式（$2a$ / $2b$ / $2y$）なら compare、
    // そうでなければ平文と直接比較し、一致時にその場でハッシュ化してDBを更新する
    // ─────────────────────────────────────────
    const storedHash = affiliate.password_hash as string
    const isBcrypt = /^\$2[aby]\$/.test(storedHash)
    let passwordValid: boolean

    if (isBcrypt) {
      passwordValid = await bcrypt.compare(password, storedHash)
    } else {
      // 平文パスワードとの比較
      passwordValid = storedHash === password
      if (passwordValid) {
        // 一致した → その場でハッシュ化してDBを更新（移行）
        const newHash = await bcrypt.hash(password, 10)
        const { error: updateError } = await supabaseAdmin
          .from('affiliates')
          .update({ password_hash: newHash })
          .eq('id', affiliate.id)
        if (updateError) {
          console.warn('[Affiliate Login] Password migration failed (login continues):', updateError)
        } else {
          console.log('[Affiliate Login] Password migrated to bcrypt:', affiliate.id)
        }
      }
    }

    if (!passwordValid) {
      console.log('[Affiliate Login] Password mismatch:', email)
      return Response.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
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
