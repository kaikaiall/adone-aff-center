import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[GET /api/admin/offers/[id]] id:', params.id)
    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      console.error('[GET /api/admin/offers/[id]] Error:', error)
      throw error
    }
    if (!data) {
      return Response.json({ error: '案件が見つかりません' }, { status: 404 })
    }
    return Response.json(data)
  } catch (error) {
    console.error('[GET /api/admin/offers/[id]] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log('[PATCH /api/admin/offers/[id]] id:', params.id, 'body:', JSON.stringify(body))

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/offers/[id]] Error:', error)
      return Response.json({ error: error.message || 'データベースエラーが発生しました' }, { status: 400 })
    }
    return Response.json(data)
  } catch (error) {
    console.error('[PATCH /api/admin/offers/[id]] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('offers').delete().eq('id', params.id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/offers/[id]] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
