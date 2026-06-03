import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .select(`
        *,
        affiliates ( id, name, email ),
        offers ( id, name, optin_price )
      `)
      .order('created_at', { ascending: false })
      .limit(500) // M6対応：無制限取得防止（最新500件）
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('[GET /api/admin/conversions]', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
