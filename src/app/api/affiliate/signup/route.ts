import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * アフィリエイター新規登録 API
 *
 * 環境変数 AFFILIATE_INVITATION_CODES に登録された招待コードを保持している人だけが登録可能。
 * 複数のコードを「,」区切りで設定可能。例: "CODE_A,CODE_B,CAMPAIGN2026"
 *
 * POST /api/affiliate/signup
 * body: { name, email, password, invitationCode }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, invitationCode } = await request.json()

    console.log('[Affiliate Signup] Attempt:', email)

    // 入力バリデーション
    if (!name || !email || !password || !invitationCode) {
      return Response.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return Response.json(
        { error: 'パスワードは8文字以上で設定してください' },
        { status: 400 }
      )
    }

    // メール形式の簡易チェック
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      )
    }

    // 招待コードを検証
    const validCodes = (process.env.AFFILIATE_INVITATION_CODES || '')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)

    if (validCodes.length === 0) {
      console.error('[Affiliate Signup] AFFILIATE_INVITATION_CODES env var is not set')
      return Response.json(
        { error: '現在、新規登録は受け付けていません' },
        { status: 503 }
      )
    }

    if (!validCodes.includes(invitationCode.trim())) {
      console.warn('[Affiliate Signup] Invalid invitation code:', invitationCode)
      return Response.json(
        { error: '招待コードが正しくありません' },
        { status: 401 }
      )
    }

    // メール重複チェック
    const { data: existing } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return Response.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      )
    }

    // アフィリエイター作成
    // 注：affiliatesテーブルのidは自動生成が効かないため、明示的にUUIDを生成する
    const newId = crypto.randomUUID()
    const { data: affiliate, error: insertError } = await supabaseAdmin
      .from('affiliates')
      .insert({
        id: newId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: password, // ※ 現状は既存システムに合わせて平文保存。将来的にbcrypt化を推奨。
        is_active: true,
      })
      .select('id, name, email')
      .single()

    if (insertError) {
      console.error('[Affiliate Signup] Insert error:', insertError)
      return Response.json(
        { error: '登録に失敗しました。しばらくしてから再度お試しください' },
        { status: 500 }
      )
    }

    console.log('[Affiliate Signup] Success:', affiliate.id)

    // 自動ログイン用のセッションCookieを発行
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set(
      'Set-Cookie',
      `affiliate_session=${affiliate.id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
    )

    return new Response(
      JSON.stringify({ ok: true, name: affiliate.name }),
      { status: 201, headers }
    )
  } catch (error) {
    console.error('[Affiliate Signup Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
