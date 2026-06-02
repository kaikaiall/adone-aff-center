import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 管理者なりすましログインAPI
 *
 * POST /api/admin/impersonate
 * body: { affiliateId: string }
 *
 * 機能：
 * - 管理者のセッションを保持したまま、指定アフィリエイターのセッションを発行
 * - 「動作確認モード」フラグも一緒に設定し、フロント側で「管理者として閲覧中」バナーを表示
 * - 解除時には自動的に管理者画面へ戻れる
 */

const COOKIE_AFFILIATE = 'affiliate_session'
const COOKIE_IMPERSONATING = 'admin_impersonating'
const COOKIE_ADMIN = 'admin_auth'

export async function POST(request: NextRequest) {
  try {
    // 1. 管理者認証チェック
    const cookieStore = cookies()
    const adminAuth = cookieStore.get(COOKIE_ADMIN)
    if (!adminAuth || adminAuth.value !== 'true') {
      return Response.json({ error: '管理者認証が必要です' }, { status: 401 })
    }

    // 2. 指定アフィリエイターを取得
    const { affiliateId } = await request.json()
    if (!affiliateId) {
      return Response.json({ error: 'affiliateId が必要です' }, { status: 400 })
    }

    const { data: affiliate, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, is_active')
      .eq('id', affiliateId)
      .maybeSingle()

    if (error || !affiliate) {
      console.error('[Impersonate] Affiliate not found:', affiliateId, error)
      return Response.json({ error: 'アフィリエイターが見つかりません' }, { status: 404 })
    }

    if (!affiliate.is_active) {
      return Response.json({ error: 'このアカウントは無効化されています' }, { status: 403 })
    }

    console.log('[Impersonate] Admin → Affiliate:', affiliate.id, affiliate.email)

    // 3. アフィリエイターセッション + なりすましフラグを発行（短めの有効期限：1時間）
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `${COOKIE_AFFILIATE}=${affiliate.id}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
    )
    headers.append(
      'Set-Cookie',
      `${COOKIE_IMPERSONATING}=1; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
    )

    return new Response(
      JSON.stringify({
        ok: true,
        affiliate: { id: affiliate.id, name: affiliate.name, email: affiliate.email },
      }),
      { status: 200, headers },
    )
  } catch (error) {
    console.error('[Impersonate Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/impersonate
 *
 * なりすましモードを終了する。
 * affiliate_session と admin_impersonating Cookie をクリアして管理者画面に戻る。
 */
export async function DELETE() {
  try {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `${COOKIE_AFFILIATE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    )
    headers.append(
      'Set-Cookie',
      `${COOKIE_IMPERSONATING}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    )

    console.log('[Impersonate] Session ended')

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  } catch (error) {
    console.error('[Impersonate End Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
