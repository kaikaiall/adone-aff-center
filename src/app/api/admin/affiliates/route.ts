import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // password_hash は返却しない（セキュリティ）
    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, phone, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[POST /api/admin/affiliates] Body:', JSON.stringify({ ...body, password_hash: '***' }))

    // バリデーション
    if (!body.id?.trim()) return Response.json({ error: 'IDを入力してください' }, { status: 400 })
    if (!body.name?.trim()) return Response.json({ error: '名前を入力してください' }, { status: 400 })
    if (!body.email?.trim()) return Response.json({ error: 'メールアドレスを入力してください' }, { status: 400 })
    if (!body.password_hash?.trim()) return Response.json({ error: 'パスワードを入力してください' }, { status: 400 })

    // ID重複チェック
    const { data: existingById } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('id', body.id)
      .maybeSingle()
    if (existingById) return Response.json({ error: `ID「${body.id}」はすでに使用されています` }, { status: 400 })

    // メール重複チェック
    const { data: existingByEmail } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', body.email)
      .maybeSingle()
    if (existingByEmail) return Response.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 400 })

    // パスワードをハッシュ化してから保存（M1対応）
    const hashedPassword = await bcrypt.hash(body.password_hash.trim(), 10)
    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .insert({ ...body, password_hash: hashedPassword, is_active: body.is_active ?? true })
      // password_hash は返却しない（M2対応）
      .select('id, name, email, phone, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder, is_active, created_at, updated_at')
      .single()

    if (error) {
      console.error('[POST /api/admin/affiliates] Supabase error:', error)
      if (error.code === '23505') {
        return Response.json({ error: 'このIDまたはメールアドレスはすでに登録されています' }, { status: 400 })
      }
      return Response.json({ error: error.message || 'データベースエラーが発生しました' }, { status: 400 })
    }

    console.log('[POST /api/admin/affiliates] Created:', data?.id)
    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/affiliates] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
