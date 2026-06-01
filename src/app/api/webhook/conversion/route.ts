import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Webhook /api/webhook/conversion
 *
 * 対応CRM: Lステップ, UTAGE, エルメ, プロライン, MyASP 等
 * GET / POST 両対応
 *
 * GET 例（プロライン）:
 *   /api/webhook/conversion?source=proline&lineUserId=[[uid]]&displayName=[[snsname]]&offerId=offer_001&cid=aff_001
 *
 * POST 例（JSON）:
 *   { "source": "lstep", "lineUserId": "Uxxx", "displayName": "名前", "offerId": "offer_001", "cid": "aff_001" }
 */

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

  // 必須フィールドチェック
  if (!normalized.lineUserId) {
    return Response.json({
      error: 'Missing required field: lineUserId',
      debug: { received: rawPayload, normalized },
    }, { status: 400 })
  }
  if (!normalized.cid) {
    return Response.json({
      error: 'Missing required field: cid',
      debug: { received: rawPayload, normalized },
    }, { status: 400 })
  }
  if (!normalized.offerId) {
    return Response.json({
      error: 'Missing required field: offerId',
      debug: { received: rawPayload, normalized },
    }, { status: 400 })
  }

  // アフィリエイターID を解決
  let affiliateId: string | null = null

  // affiliate_links テーブルから cid で検索
  console.log('[Webhook] Looking up affiliate_links with cid:', normalized.cid)
  const { data: linkData, error: linkError } = await supabaseAdmin
    .from('affiliate_links')
    .select('affiliate_id')
    .eq('cid', normalized.cid)
    .maybeSingle()

  if (linkError) console.error('[Webhook] affiliate_links lookup error:', linkError)

  if (linkData) {
    affiliateId = linkData.affiliate_id
    console.log('[Webhook] Affiliate found via affiliate_links:', affiliateId)
  } else {
    // cid が直接アフィリエイター ID（aff_001 等）の場合
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

  if (!affiliateId) {
    return Response.json({
      error: 'Affiliate not found',
      debug: { cid: normalized.cid, failedAt: 'affiliate_lookup' },
    }, { status: 400 })
  }

  // 案件IDを検証
  console.log('[Webhook] Checking offer:', normalized.offerId)
  const { data: offerData, error: offerError } = await supabaseAdmin
    .from('offers')
    .select('id')
    .eq('id', normalized.offerId)
    .maybeSingle()

  if (offerError) console.error('[Webhook] offers lookup error:', offerError)

  if (!offerData) {
    return Response.json({
      error: 'Offer not found',
      debug: { offerId: normalized.offerId, failedAt: 'offer_lookup' },
    }, { status: 400 })
  }

  // 重複チェック（同一 LINE UID + 案件 + アフィリエイター）
  const { data: existingConv } = await supabaseAdmin
    .from('conversions')
    .select('id, status')
    .eq('line_user_id', normalized.lineUserId)
    .eq('offer_id', normalized.offerId)
    .eq('affiliate_id', affiliateId)
    .maybeSingle()

  if (existingConv) {
    console.log('[Webhook] Duplicate conversion detected:', existingConv.id)
    return Response.json({
      success: true,
      conversionId: existingConv.id,
      status: existingConv.status,
      duplicate: true,
    }, { status: 200 })
  }

  // 成果を挿入
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const userAgent = request.headers.get('user-agent') || null

  console.log('[Webhook] Inserting conversion...')
  const { data: conversion, error: convError } = await supabaseAdmin
    .from('conversions')
    .insert({
      affiliate_id: affiliateId,
      offer_id: normalized.offerId,
      line_user_id: normalized.lineUserId,
      display_name: normalized.displayName,
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
    return Response.json({
      error: 'Failed to insert conversion',
      debug: { message: convError.message, details: convError.details },
    }, { status: 500 })
  }

  // LINE ユーザー情報を upsert
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

  console.log('[Webhook] ===== Success =====')
  return Response.json({
    success: true,
    conversionId: conversion.id,
    status: 'pending',
  }, { status: 200 })
}

// ─────────────────────────────────────────
// GET: クエリパラメータで成果記録（プロライン等）
// パラメータが存在しない場合は疎通確認レスポンスを返す
// ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  console.log('[Webhook] ===== GET Request received =====')

  const { searchParams } = request.nextUrl
  const params = Object.fromEntries(searchParams.entries())

  console.log('[Webhook] Query params:', JSON.stringify(params))

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
    })
  }

  // クエリパラメータがある → 成果記録処理へ
  try {
    const normalized = normalizeParams(params)
    return await handleConversion(normalized, params, request)
  } catch (error) {
    console.error('[Webhook] Unexpected error (GET):', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
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
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  console.log('[Webhook] Received body:', JSON.stringify(body))

  try {
    const normalized = normalizeParams(body)
    return await handleConversion(normalized, body, request)
  } catch (error) {
    console.error('[Webhook] Unexpected error (POST):', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
