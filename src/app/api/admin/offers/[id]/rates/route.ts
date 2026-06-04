import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/** GET /api/admin/offers/[id]/rates — 案件の特別単価一覧 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: rates, error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .select('*')
      .eq('offer_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /rates] Error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!rates || rates.length === 0) {
      return Response.json([])
    }

    // affiliate_id から名前を取得（FK制約なしのため手動 JOIN）
    const affiliateIds = Array.from(new Set(rates.map(r => r.affiliate_id)))
    const { data: affiliates } = await supabaseAdmin
      .from('affiliates')
      .select('id, name')
      .in('id', affiliateIds)

    const affiliateMap = Object.fromEntries(
      (affiliates || []).map(a => [a.id, a.name])
    )

    const result = rates.map(r => ({
      ...r,
      affiliate_name: affiliateMap[r.affiliate_id] || r.affiliate_id,
    }))

    return Response.json(result)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/** POST /api/admin/offers/[id]/rates — 特別単価を追加 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { affiliate_id, custom_optin_price } = body

    if (!affiliate_id?.trim()) {
      return Response.json({ error: 'アフィリエイターを選択してください' }, { status: 400 })
    }
    if (
      custom_optin_price === undefined ||
      custom_optin_price === null ||
      Number(custom_optin_price) < 0 ||
      isNaN(Number(custom_optin_price))
    ) {
      return Response.json({ error: '単価は0以上の数値を入力してください' }, { status: 400 })
    }

    // アフィリエイター存在確認
    const { data: affData } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('id', affiliate_id)
      .maybeSingle()
    if (!affData) {
      return Response.json({ error: 'アフィリエイターが見つかりません' }, { status: 404 })
    }

    // 案件存在確認
    const { data: offerData } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (!offerData) {
      return Response.json({ error: '案件が見つかりません' }, { status: 404 })
    }

    const newId = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const { data, error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .insert({
        id: newId,
        affiliate_id: affiliate_id.trim(),
        offer_id: params.id,
        custom_optin_price: Number(custom_optin_price),
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[POST /rates] Error:', error)
      if (error.code === '23505') {
        return Response.json(
          { error: 'このアフィリエイターの特別単価はすでに登録済みです' },
          { status: 409 }
        )
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    // affiliate_name を付けて返す
    const { data: affName } = await supabaseAdmin
      .from('affiliates')
      .select('name')
      .eq('id', affiliate_id)
      .maybeSingle()

    return Response.json(
      { ...data, affiliate_name: affName?.name || affiliate_id },
      { status: 201 }
    )
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
