import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversions_backend')
      .select('*, affiliates(id, name), offers(id, name)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[GET /api/admin/backend] Error:', error)
      throw error
    }
    return Response.json(data)
  } catch (error) {
    console.error('[GET /api/admin/backend] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[POST /api/admin/backend] Body:', JSON.stringify(body))

    const { affiliate_id, offer_id, amount, count, note } = body

    if (!affiliate_id) return Response.json({ error: 'アフィリエイターを選択してください' }, { status: 400 })
    if (!offer_id) return Response.json({ error: '案件を選択してください' }, { status: 400 })
    if (!amount && amount !== 0) return Response.json({ error: '金額を入力してください' }, { status: 400 })

    // FK制約違反を防ぐため、offer_idがoffersテーブルに存在するか事前確認
    const { data: offerExists, error: offerCheckError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', offer_id)
      .single()
    if (offerCheckError || !offerExists) {
      console.error('[POST /api/admin/backend] offer not found:', offer_id, offerCheckError)
      return Response.json({ error: '選択した案件が見つかりません。ページを再読み込みして再試行してください。' }, { status: 400 })
    }

    const insertData = {
      affiliate_id,
      offer_id,
      amount: Number(amount),
      count: Number(count) || 1,
      note: note || null,
    }
    console.log('[POST /api/admin/backend] Inserting:', JSON.stringify(insertData))

    const { data, error } = await supabaseAdmin
      .from('conversions_backend')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/backend] Supabase error:', error)
      return Response.json({
        error: error.message || 'データベースエラーが発生しました',
        details: error.details,
        hint: error.hint,
      }, { status: 400 })
    }

    console.log('[POST /api/admin/backend] Created:', data?.id)
    revalidatePath('/admin/backend')
    revalidatePath('/affiliate/dashboard')
    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/backend] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
