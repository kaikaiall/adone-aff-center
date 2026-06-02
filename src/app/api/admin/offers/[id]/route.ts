import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) return Response.json({ error: '案件が見つかりません' }, { status: 404 })
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log('[PATCH offers] id:', params.id, 'body:', JSON.stringify(body))

    // idなど不要なフィールドを除外し、文字列フィールドはnullではなく空文字で保存
    const { id, created_at, updated_at, ...fields } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const textFields = ['name', 'description', 'banner_url', 'lp_url', 'line_add_url', 'appeal_points', 'target_audience', 'notes']
    const boolFields = ['has_backend', 'is_active']
    const numFields = ['optin_price', 'backend_rate']

    for (const key of textFields) {
      if (key in fields) updateData[key] = fields[key] ?? ''
    }
    for (const key of boolFields) {
      if (key in fields) updateData[key] = fields[key] ?? false
    }
    for (const key of numFields) {
      if (key in fields) updateData[key] = fields[key] ?? 0
    }

    console.log('[PATCH offers] updateData:', JSON.stringify(updateData))

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH offers] Error:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    console.log('[PATCH offers] Success:', JSON.stringify(data))

    // Next.jsのページキャッシュを無効化（編集画面と一覧画面）
    revalidatePath(`/admin/offers/${params.id}/edit`)
    revalidatePath('/admin/offers')

    return Response.json(data)
  } catch (error) {
    console.error('[PATCH offers] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('offers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (error) throw error

    // Next.jsのページキャッシュを無効化
    revalidatePath('/admin/offers')

    return Response.json({ ok: true, action: 'archived' })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
