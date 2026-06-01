import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('[GET /api/admin/offers] Fetching offers...')
    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[GET /api/admin/offers] Error:', error)
      throw error
    }
    console.log('[GET /api/admin/offers] Found:', data?.length, 'offers')
    return Response.json(data)
  } catch (error) {
    console.error('[GET /api/admin/offers] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[POST /api/admin/offers] Body:', JSON.stringify(body))

    // DBのUUID DEFAULT gen_random_uuid()に任せる（手動ID不要）
    delete body.id

    // 必須項目チェック
    if (!body.name?.trim()) {
      return Response.json({ error: '案件名は必須です' }, { status: 400 })
    }
    if (body.optin_price === undefined || body.optin_price === null) {
      return Response.json({ error: 'オプトイン単価は必須です' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('offers')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/offers] Supabase error:', error)
      if (error.code === '23505') {
        return Response.json({ error: 'この案件IDはすでに使用されています' }, { status: 400 })
      }
      return Response.json({ error: error.message || 'データベースエラーが発生しました' }, { status: 400 })
    }

    console.log('[POST /api/admin/offers] Created:', data?.id)
    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/offers] Catch:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
