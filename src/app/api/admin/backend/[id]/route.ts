import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // status 変更（バックエンドタブからの承認/却下/保留）
    if (body.status !== undefined && Object.keys(body).length === 1) {
      if (!['approved', 'rejected', 'pending', 'deleted'].includes(body.status)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin
        .from('conversions_backend')
        .update({ status: body.status })
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      revalidatePath('/admin/conversions')
      revalidatePath('/admin/backend')
      revalidatePath('/affiliate/dashboard')
      return Response.json(data)
    }

    // フィールド編集（編集モーダルから）
    const { affiliate_id, offer_id, amount, count, note } = body
    if (!affiliate_id || !offer_id || amount === undefined) {
      return Response.json({ error: '必須項目が不足しています' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('conversions_backend')
      .update({
        affiliate_id,
        offer_id,
        amount: Number(amount),
        count: Number(count) || 1,
        note: note || null,
      })
      .eq('id', params.id)
      .select('*, affiliates(name), offers(name)')
      .single()
    if (error) throw error
    revalidatePath('/admin/backend')
    revalidatePath('/affiliate/dashboard')
    return Response.json(data)
  } catch (error) {
    console.error('[PATCH /api/admin/backend/[id]]', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('conversions_backend').delete().eq('id', params.id)
    if (error) throw error
    revalidatePath('/admin/backend')
    revalidatePath('/affiliate/dashboard')
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
