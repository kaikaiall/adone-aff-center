import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { findMatchingClick, markClickAsMatched } from '@/lib/conversion-matching'
import { getEffectiveOptinPrice } from '@/lib/pricing'

/**
 * Webhook /api/webhook/conversion
 *
 * 対応CRM: Lステップ, UTAGE, エルメ, プロライン, MyASP 等
 * GET / POST 両対応
 *
 * 【重要：安全設計】
 * CRMツールのステップ配信を絶対に止めないために、
 * このエンドポイントは「常に 200 OK」を返す方針を採用しています。
 * - バリデーションエラー → 200（warningを含むレスポンス）
 * - DBエラー → 200（errorを含むレスポンス）
 * - 正常処理 → 200（successを含むレスポンス）
 *
 * これにより、CRM 側はリトライ／停止せず、ステップ配信は通常通り流れます。
 * エラー詳細は Vercel ログから確認可能です。
 */

/** ステップ配信を阻害しない安全な応答ヘルパー */
function safeResponse(body: Record<string, unknown>, status = 200) {
  return Response.json({ status: 'received', ...body }, { status })
}

/** ログ出力用に secret / token フィールドをマスクする */
function maskSecret(obj: Record<string, unknown>) {
  const masked = { ...obj }
  if ('secret' in masked) masked.secret = '***'
  if ('token' in masked) masked.token = '***'
  return masked
}

/** クエリパラメータまたはボディから正規化されたフィールドを取り出す共通処理 */
function normalizeParams(params: Record<string, unknown>) {
  return {
    lineUserId:
      (params.lineUserId as string) ||
      (params.line_user_id as string) ||
      (params.userId as string) ||
      (params.LineuserID as string) ||
      null,
    displayName:
      (params.displayName as string) ||
      (params.display_name as string) ||
      (params.userName as string) ||
      null,
    offerId:
      (params.offerId as string) ||
      (params.offer_id as string) ||
      (params.campaignId as string) ||
      null,
    cid:
      (params.cid as string) ||
      (params.aff_id as string) ||
      (params.affiliate_id as string) ||
      null,
    source: (params.source as string) || 'unknown',
  }
}

/** 正規化済みパラメータを受け取り、成果を記録して Response を返す共通ハンドラー */
async function handleConversion(
  normalized: ReturnType<typeof normalizeParams>,
  rawPayload: Record<string, unknown>,
  request: NextRequest,
): Promise<Response> {
  console.log('[Webhook] Normalized:', JSON.stringify(normalized))

  // ─────────────────────────────────────────
  // セキュリティ：シークレットトークン検証
  // 環境変数 WEBHOOK_SECRET が設定されていれば、リクエストにも同値が必要
  // 一致しない場合は「200を返しつつ」DB書き込みを行わない（ステップ配信は保護）
  // ─────────────────────────────────────────
  const requiredSecret = process.env.WEBHOOK_SECRET
  if (requiredSecret) {
    const providedSecret = (rawPayload.secret as string) || (rawPayload.token as string) || ''
    if (providedSecret !== requiredSecret) {
      console.warn('[Webhook] 🚫 Unauthorized: secret mismatch')
      return safeResponse({
        warning: 'Unauthorized: invalid or missing secret',
        debug: { providedSecretLength: providedSecret.length },
      })
    }
    console.log('[Webhook] ✅ Secret verified')
  }

  // lineUserId は CRM から必ず渡されるため必須
  if (!normalized.lineUserId) {
    console.warn('[Webhook] Missing lineUserId')
    return safeResponse({ warning: 'Missing lineUserId', debug: { received: rawPayload } })
  }

  // IP / UA / Cookie を取得（クリック紐付けに使用）
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const userAgent = request.headers.get('user-agent') || null
  const cookieHeader = request.headers.get('cookie') || ''
  const cookieId = cookieHeader.match(/adone_click_id=([^;]+)/)?.[1] ?? null

  try {
    // ─────────────────────────────────────────
    // アフィリエイターID を解決（cid 直接 or クリック紐付け）
    // ─────────────────────────────────────────
    let affiliateId: string | null = null
    let resolvedOfferId: string | null = normalized.offerId
    let matchType: 'direct' | 'cookie' | 'ip_ua' | 'ip_only' | 'none' = 'none'
    let matchedClickId: string | null = null

    if (normalized.cid) {
      // ── 従来パス（cid が渡された場合） ─────────────────────
      console.log('[Webhook] Looking up affiliate_links with cid:', normalized.cid)
      const { data: linkData, error: linkError } = await supabaseAdmin
        .from('affiliate_links')
        .select('affiliate_id, offer_id')
        .eq('cid', normalized.cid)
        .maybeSingle()

      if (linkError) console.error('[Webhook] affiliate_links lookup error:', linkError)

      if (linkData) {
        affiliateId = linkData.affiliate_id
        if (!resolvedOfferId) resolvedOfferId = linkData.offer_id
        console.log('[Webhook] Affiliate found via affiliate_links:', affiliateId)
      } else {
        // cid が直接 affiliate ID（aff_001 等）の旧式
        console.log('[Webhook] Not in affiliate_links, trying direct id:', normalized.cid)
        const { data: affData, error: affError } = await supabaseAdmin
          .from('affiliates')
          .select('id')
          .eq('id', normalized.cid)
          .maybeSingle()

        if (affError) console.error('[Webhook] affiliates lookup error:', affError)
        if (affData) {
          affiliateId = affData.id
          console.log('[Webhook] Affiliate found via direct id:', affiliateId)
        }
      }

      if (affiliateId) {
        matchType = 'direct'
        // 直接解決できた場合でも、可能なら link_clicks との紐付けを試みる
        const matchResult = await findMatchingClick({ cookieId, ipAddress, userAgent })
        if (matchResult) {
          matchedClickId = matchResult.click.id
          console.log('[Webhook] Also matched click record:', matchedClickId, 'type:', matchResult.matchType)
        }
      }
    }

    // ── クリック紐付けパス（cid なし、または cid 解決失敗） ──
    if (!affiliateId) {
      console.log('[Webhook] cid not resolved, trying click matching...')
      const matchResult = await findMatchingClick({ cookieId, ipAddress, userAgent })

      if (matchResult) {
        affiliateId = matchResult.click.affiliate_id
        if (!resolvedOfferId) resolvedOfferId = matchResult.click.offer_id
        matchType = matchResult.matchType
        matchedClickId = matchResult.click.id
        console.log('[Webhook] Matched via click record:', matchedClickId, 'type:', matchType)
      }
    }

    if (!affiliateId) {
      console.warn('[Webhook] Affiliate not found: no cid and no matching click')
      return safeResponse({
        warning: 'Affiliate not found',
        debug: { cid: normalized.cid, matchType: 'none' },
      })
    }

    if (!resolvedOfferId) {
      console.warn('[Webhook] offerId not resolved')
      return safeResponse({
        warning: 'Missing offerId',
        debug: { received: rawPayload },
      })
    }

    // 案件IDを検証
    console.log('[Webhook] Checking offer:', resolvedOfferId)
    const { data: offerData, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', resolvedOfferId)
      .maybeSingle()

    if (offerError) console.error('[Webhook] offers lookup error:', offerError)

    if (!offerData) {
      console.warn('[Webhook] Offer not found:', resolvedOfferId)
      return safeResponse({ warning: 'Offer not found', debug: { offerId: resolvedOfferId } })
    }

    // 重複チェック（同一 LINE UID + 案件 + アフィリエイター）
    const { data: existingConv } = await supabaseAdmin
      .from('conversions')
      .select('id, status')
      .eq('line_user_id', normalized.lineUserId)
      .eq('offer_id', resolvedOfferId)
      .eq('affiliate_id', affiliateId)
      .maybeSingle()

    if (existingConv) {
      console.log('[Webhook] Duplicate conversion detected:', existingConv.id)
      return safeResponse({
        success: true,
        conversionId: existingConv.id,
        status: existingConv.status,
        duplicate: true,
        matchType,
      })
    }

    // 成果を挿入
    console.log('[Webhook] Inserting conversion...')
    const amount = await getEffectiveOptinPrice(affiliateId, resolvedOfferId)
    const { data: conversion, error: convError } = await supabaseAdmin
      .from('conversions')
      .insert({
        affiliate_id: affiliateId,
        offer_id: resolvedOfferId,
        line_user_id: normalized.lineUserId,
        display_name: normalized.displayName,
        amount,
        status: 'pending',
        source: normalized.source,
        ip_address: ipAddress,
        user_agent: userAgent,
        raw_payload: rawPayload,
      })
      .select()
      .single()

    if (convError) {
      console.error('[Webhook] Failed to insert conversion:', convError)
      return safeResponse({ error: 'Failed to insert', debug: { message: convError.message } })
    }

    // クリック記録を紐付け済みにマーク（失敗しても成果記録には影響なし）
    if (matchedClickId) {
      await markClickAsMatched(matchedClickId, conversion.id)
    }

    // LINE ユーザー情報を upsert（失敗してもメイン処理には影響させない）
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        line_user_id: normalized.lineUserId,
        display_name: normalized.displayName,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'line_user_id',
        ignoreDuplicates: false,
      })

    if (userError) console.warn('[Webhook] Users upsert warning:', userError)

    console.log('[Webhook] ===== Success =====', { matchType })
    return safeResponse({
      success: true,
      conversionId: conversion.id,
      matchType,
    })
  } catch (err) {
    // 想定外の例外もキャッチ → ステップ配信を止めない
    console.error('[Webhook] Unhandled exception:', err)
    return safeResponse({
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

// ─────────────────────────────────────────
// GET: クエリパラメータで成果記録（プロライン等）
// パラメータが存在しない場合は疎通確認レスポンスを返す
// ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  console.log('[Webhook] ===== GET Request received =====')

  const { searchParams } = request.nextUrl
  const params = Object.fromEntries(searchParams.entries())

  console.log('[Webhook] Query params:', JSON.stringify(maskSecret(params)))

  // クエリパラメータが何もない → 疎通確認レスポンス
  if (Object.keys(params).length === 0) {
    return Response.json({
      status: 'ok',
      endpoint: '/api/webhook/conversion',
      methods: ['GET', 'POST'],
      description: 'LINE Affiliate Conversion Webhook',
      required: ['lineUserId', 'cid', 'offerId'],
      optional: ['displayName', 'source'],
      example_get: '/api/webhook/conversion?source=proline&lineUserId=Uxxx&displayName=名前&offerId=offer_001&cid=aff_001',
      safety: 'This endpoint always returns 200 to protect CRM step delivery.',
    })
  }

  // クエリパラメータがある → 成果記録処理へ
  try {
    const normalized = normalizeParams(params)
    return await handleConversion(normalized, params, request)
  } catch (error) {
    console.error('[Webhook] Unexpected error (GET):', error)
    return safeResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// ─────────────────────────────────────────
// POST: リクエストボディ（JSON / form-urlencoded）で成果記録
// ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  console.log('[Webhook] ===== POST Request received =====')

  let body: Record<string, unknown>
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      body = Object.fromEntries(new URLSearchParams(text))
    } else {
      body = await request.json()
    }
  } catch (parseErr) {
    console.error('[Webhook] Failed to parse body:', parseErr)
    return safeResponse({ warning: 'Invalid request body' })
  }

  console.log('[Webhook] Received body:', JSON.stringify(maskSecret(body)))

  try {
    const normalized = normalizeParams(body)
    return await handleConversion(normalized, body, request)
  } catch (error) {
    console.error('[Webhook] Unexpected error (POST):', error)
    return safeResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
