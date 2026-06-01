import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const affiliateId = cookieStore.get('affiliate_session')?.value
    if (!affiliateId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, phone, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder')
      .eq('id', affiliateId)
      .single()
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const affiliateId = cookieStore.get('affiliate_session')?.value
    if (!affiliateId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowedFields = ['name', 'email', 'phone', 'bank_name', 'bank_branch', 'bank_account_type', 'bank_account_number', 'bank_account_holder']
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .update(updateData)
      .eq('id', affiliateId)
      .select()
      .single()
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
