import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    // ④ 'deleted' を含む有効なステータスを許可
    if (!['approved', 'rejected', 'pending', 'deleted'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('[PATCH /api/admin/conversions/[id]]', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// ④ DELETE エンドポイントは status='deleted' に変更（物理削除しない）
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()
    if (error) throw error
    return Response.json({ ok: true, status: 'deleted' })
  } catch (error) {
    console.error('[DELETE /api/admin/conversions/[id]]', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
