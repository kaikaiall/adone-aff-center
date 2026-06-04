import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/** PATCH /api/admin/offers/[id]/rates/[rateId] — 特別単価を更新 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; rateId: string } }
) {
  try {
    const body = await request.json()
    const { custom_optin_price } = body

    if (
      custom_optin_price === undefined ||
      custom_optin_price === null ||
      Number(custom_optin_price) < 0 ||
      isNaN(Number(custom_optin_price))
    ) {
      return Response.json({ error: '単価は0以上の数値を入力してください' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .update({
        custom_optin_price: Number(custom_optin_price),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.rateId)
      .eq('offer_id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('[PATCH /rates/[rateId]] Error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return Response.json({ error: '特別単価が見つかりません' }, { status: 404 })
    }

    return Response.json(data)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/offers/[id]/rates/[rateId] — 論理削除（is_active = false） */
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; rateId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.rateId)
      .eq('offer_id', params.id)

    if (error) {
      console.error('[DELETE /rates/[rateId]] Error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ ok: true, action: 'deactivated' })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
