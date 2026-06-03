import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } },
) {
  const { cid } = params
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const userAgent = request.headers.get('user-agent') || null
  const referer = request.headers.get('referer') || null

  // ─────────────────────────────────────────
  // 1. cid から affiliate_id / offer_id を解決
  // ─────────────────────────────────────────
  let affiliateId: string | null = null
  let offerId: string | null = null
  let lineAddUrl: string | null = null

  // まず affiliate_links テーブルで検索
  const { data: linkData } = await supabaseAdmin
    .from('affiliate_links')
    .select('affiliate_id, offer_id, offers(line_add_url)')
    .eq('cid', cid)
    .maybeSingle()

  if (linkData) {
    affiliateId = linkData.affiliate_id
    offerId = linkData.offer_id
    const offer = (
      Array.isArray(linkData.offers) ? linkData.offers[0] : linkData.offers
    ) as { line_add_url: string | null } | null
    lineAddUrl = offer?.line_add_url ?? null
  } else {
    // フォールバック: cid が aff_xxx などの直接 affiliate ID の場合
    const { data: affData } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('id', cid)
      .maybeSingle()

    if (affData) {
      affiliateId = affData.id
      // offer_id は解決できない（cid が affiliate ID 直指定の旧式）
    }
  }

  // cid が全く解決できない → エラーページ
  if (!affiliateId && !offerId) {
    const errorUrl = new URL(`/r/${cid}/error`, request.url)
    errorUrl.searchParams.set('reason', 'invalid_cid')
    return NextResponse.redirect(errorUrl, { status: 302 })
  }

  // line_add_url が未設定 → エラーページ
  if (!lineAddUrl) {
    const errorUrl = new URL(`/r/${cid}/error`, request.url)
    errorUrl.searchParams.set('reason', 'no_destination')
    return NextResponse.redirect(errorUrl, { status: 302 })
  }

  // ─────────────────────────────────────────
  // 2. クリック記録を link_clicks に INSERT
  // ─────────────────────────────────────────
  const cookieId = crypto.randomUUID()
  const clickId = `click_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  try {
    const { error: insertError } = await supabaseAdmin
      .from('link_clicks')
      .insert({
        id: clickId,
        cid,
        affiliate_id: affiliateId,
        offer_id: offerId,
        ip_address: ipAddress,
        user_agent: userAgent,
        cookie_id: cookieId,
        referer,
      })
    if (insertError) {
      console.error('[/r/[cid]] link_clicks insert error:', insertError)
      // DB書き込み失敗でもリダイレクトは継続（ユーザー体験を壊さない）
    }
  } catch (err) {
    console.error('[/r/[cid]] Unexpected error on click recording:', err)
  }

  // ─────────────────────────────────────────
  // 3. Cookie をセットして line_add_url へリダイレクト
  // ─────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOptions = [
    `adone_click_id=${cookieId}`,
    'Path=/',
    'Max-Age=2592000', // 30日
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
    // HttpOnly=false（意図的に省略 → JSからも読める）
  ].filter(Boolean).join('; ')

  // cid をリダイレクト先URLに付与（CRM側でカスタムフィールドとして保持させるため）
  let finalUrl: string
  try {
    const url = new URL(lineAddUrl)
    url.searchParams.set('cid', cid) // 既存の cid パラメータがあれば上書き
    finalUrl = url.toString()
  } catch {
    // 不正URLの場合は文字列結合フォールバック
    const separator = lineAddUrl.includes('?') ? '&' : '?'
    finalUrl = `${lineAddUrl}${separator}cid=${encodeURIComponent(cid)}`
  }

  const response = NextResponse.redirect(finalUrl, { status: 302 })
  response.headers.append('Set-Cookie', cookieOptions)
  return response
}
