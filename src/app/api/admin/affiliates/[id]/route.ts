import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log('[PATCH /api/admin/affiliates/[id]] id:', params.id)

    const allowedFields = [
      'name', 'email', 'password_hash', 'phone',
      'bank_name', 'bank_branch', 'bank_account_type',
      'bank_account_number', 'bank_account_holder', 'is_active',
    ]
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      // パスワードは空文字列の場合は更新しない
      if (field === 'password_hash' && !body[field]?.trim()) continue
      if (field in body) updateData[field] = body[field]
    }

    // メール変更時の重複チェック
    if (updateData.email) {
      const { data: existing } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('email', updateData.email as string)
        .neq('id', params.id)
        .maybeSingle()
      if (existing) {
        return Response.json({ error: 'このメールアドレスはすでに使用されています' }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/affiliates/[id]] Error:', error)
      return Response.json({ error: error.message || 'データベースエラーが発生しました' }, { status: 400 })
    }
    return Response.json(data)
  } catch (error) {
    console.error('[PATCH /api/admin/affiliates/[id]] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('affiliates').delete().eq('id', params.id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/affiliates/[id]] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
