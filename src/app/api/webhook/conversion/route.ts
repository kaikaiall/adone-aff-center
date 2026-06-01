import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/webhook/conversion
 *
 * 対応CRM: Lステップ, UTAGE, エルメ, プロライン, MyASP 等
 *
 * リクエスト例:
 * {
 *   "source": "lstep",
 *   "lineUserId": "U1234567890abcdef",
 *   "displayName": "ユーザー名",
 *   "offerId": "offer_001",
 *   "cid": "aff_001"
 * }
 */
export async function POST(request: NextRequest) {
  console.log('[Webhook] ===== Request received =====')

  try {
    // 1. リクエストボディをパース
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

    console.log('[Webhook] Received:', JSON.stringify(body))

    // 2. フィールドを正規化（各CRMのフィールド名差異を吸収）
    const normalized = {
      lineUserId:
        (body.lineUserId as string) ||
        (body.line_user_id as string) ||
        (body.userId as string) ||
        (body.LineuserID as string) ||
        null,
      displayName:
        (body.displayName as string) ||
        (body.display_name as string) ||
        (body.userName as string) ||
        null,
      offerId:
        (body.offerId as string) ||
        (body.offer_id as string) ||
        (body.campaignId as string) ||
        null,
      cid:
        (body.cid as string) ||
        (body.aff_id as string) ||
        (body.affiliate_id as string) ||
        null,
      source: (body.source as string) || 'unknown',
    }

    console.log('[Webhook] Normalized:', JSON.stringify(normalized))

    // 3. 必須フィールドチェック
    if (!normalized.lineUserId) {
      return Response.json({
        error: 'Missing required field: lineUserId',
        debug: { received: body, normalized },
      }, { status: 400 })
    }

    if (!normalized.cid) {
      return Response.json({
        error: 'Missing required field: cid',
        debug: { received: body, normalized },
      }, { status: 400 })
    }

    if (!normalized.offerId) {
      return Response.json({
        error: 'Missing required field: offerId',
        debug: { received: body, normalized },
      }, { status: 400 })
    }

    // 4. アフィリエイターID を解決
    let affiliateId: string | null = null

    // 4-1. affiliate_links テーブルから cid で検索
    console.log('[Webhook] Looking up affiliate_links with cid:', normalized.cid)
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('affiliate_links')
      .select('affiliate_id')
      .eq('cid', normalized.cid)
      .maybeSingle()

    if (linkError) {
      console.error('[Webhook] affiliate_links lookup error:', linkError)
    }

    if (linkData) {
      affiliateId = linkData.affiliate_id
      console.log('[Webhook] Affiliate found via affiliate_links:', affiliateId)
    } else {
      // 4-2. cid が直接アフィリエイター ID（aff_001 等）の場合
      console.log('[Webhook] Not in affiliate_links, trying direct affiliate id lookup:', normalized.cid)
      const { data: affData, error: affError } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('id', normalized.cid)
        .maybeSingle()

      if (affError) {
        console.error('[Webhook] affiliates lookup error:', affError)
      }

      if (affData) {
        affiliateId = affData.id
        console.log('[Webhook] Affiliate found via direct id:', affiliateId)
      }
    }

    console.log('[Webhook] Affiliate resolved:', affiliateId)

    if (!affiliateId) {
      return Response.json({
        error: 'Affiliate not found',
        debug: {
          cid: normalized.cid,
          failedAt: 'affiliate_lookup',
        },
      }, { status: 400 })
    }

    // 5. 案件IDを検証
    console.log('[Webhook] Checking offer:', normalized.offerId)
    const { data: offerData, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', normalized.offerId)
      .maybeSingle()

    if (offerError) {
      console.error('[Webhook] offers lookup error:', offerError)
    }

    console.log('[Webhook] Offer check result:', offerData, offerError)

    if (!offerData) {
      return Response.json({
        error: 'Offer not found',
        debug: {
          offerId: normalized.offerId,
          failedAt: 'offer_lookup',
        },
      }, { status: 400 })
    }

    // 6. 重複チェック（同一 LINE UID + 案件 + アフィリエイター）
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

    // 7. 成果を挿入
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
        raw_payload: body,
      })
      .select()
      .single()

    console.log('[Webhook] Conversion insert result:', conversion, convError)

    if (convError) {
      console.error('[Webhook] Failed to insert conversion:', convError)
      return Response.json({
        error: 'Failed to insert conversion',
        debug: { message: convError.message, details: convError.details },
      }, { status: 500 })
    }

    // 8. LINE ユーザー情報を upsert
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

    if (userError) {
      console.warn('[Webhook] Users upsert warning:', userError)
    }

    console.log('[Webhook] ===== Success =====')
    return Response.json({
      success: true,
      conversionId: conversion.id,
      status: 'pending',
    }, { status: 200 })

  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// GET: 疎通確認用
export async function GET() {
  return Response.json({
    status: 'ok',
    endpoint: 'POST /api/webhook/conversion',
    description: 'LINE Affiliate Conversion Webhook',
    required: ['lineUserId', 'cid', 'offerId'],
    optional: ['displayName', 'source', 'timestamp'],
    supported_field_names: {
      lineUserId: ['lineUserId', 'line_user_id', 'userId'],
      displayName: ['displayName', 'display_name', 'userName'],
      offerId: ['offerId', 'offer_id'],
      cid: ['cid', 'aff_id', 'affiliate_id'],
    },
  })
}
