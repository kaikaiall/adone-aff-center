import { supabaseAdmin } from '@/lib/supabase'
import { LinkClick } from '@/lib/types'

export type MatchType = 'cookie' | 'ip_ua' | 'ip_only'

export interface MatchResult {
  click: LinkClick
  matchType: MatchType
}

interface FindMatchingClickParams {
  cookieId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  /** 検索ウィンドウ（分）。デフォルト 30 分 */
  windowMinutes?: number
  /** IP のみ一致を有効にするか。デフォルト false */
  enableIpOnly?: boolean
}

/**
 * Webhook で受け取ったパラメータをもとに、直前のクリック記録を探す。
 *
 * 優先度:
 * 1. cookie_id 完全一致 + windowMinutes 以内
 * 2. IP + UA 完全一致 + windowMinutes 以内（直近1件）
 * 3. IP のみ一致 + 5分以内（enableIpOnly=true の場合のみ）
 *
 * ※ matched_at が NULL のレコードのみ対象（再利用防止）
 */
export async function findMatchingClick(
  params: FindMatchingClickParams,
): Promise<MatchResult | null> {
  const { cookieId, ipAddress, userAgent, windowMinutes = 30, enableIpOnly = false } = params

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  // ── 優先度1: cookie_id 完全一致 ──────────────────────────
  if (cookieId) {
    const { data, error } = await supabaseAdmin
      .from('link_clicks')
      .select('*')
      .eq('cookie_id', cookieId)
      .is('matched_at', null)
      .gte('clicked_at', windowStart)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) console.error('[conversion-matching] cookie lookup error:', error)
    if (data) return { click: data as LinkClick, matchType: 'cookie' }
  }

  // ── 優先度2: IP + UA 完全一致 ────────────────────────────
  if (ipAddress && userAgent) {
    const { data, error } = await supabaseAdmin
      .from('link_clicks')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('user_agent', userAgent)
      .is('matched_at', null)
      .gte('clicked_at', windowStart)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) console.error('[conversion-matching] ip+ua lookup error:', error)
    if (data) return { click: data as LinkClick, matchType: 'ip_ua' }
  }

  // ── 優先度3: IP のみ一致（フォールバック、5分以内）────────
  if (enableIpOnly && ipAddress) {
    const ipWindowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('link_clicks')
      .select('*')
      .eq('ip_address', ipAddress)
      .is('matched_at', null)
      .gte('clicked_at', ipWindowStart)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) console.error('[conversion-matching] ip-only lookup error:', error)
    if (data) return { click: data as LinkClick, matchType: 'ip_only' }
  }

  return null
}

/**
 * 紐付け成功後に link_clicks レコードを更新する。
 * conversionId は呼び出し側で確定してから渡す。
 */
export async function markClickAsMatched(
  clickId: string,
  conversionId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('link_clicks')
    .update({
      matched_at: new Date().toISOString(),
      matched_conversion_id: conversionId,
    })
    .eq('id', clickId)

  if (error) {
    console.error('[conversion-matching] markClickAsMatched error:', error)
  }
}
