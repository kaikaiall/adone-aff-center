import { supabaseAdmin } from '@/lib/supabase'

/**
 * アフィリエイター × 案件の有効オプトイン単価を返す。
 * 特別単価（affiliate_offer_rates）があればそれを返し、
 * なければ offers.optin_price にフォールバックする。
 *
 * グレースフル・フォールバック保証：
 * 1. affiliate_offer_rates クエリ成功 + データなし → offers.optin_price を返す
 * 2. affiliate_offer_rates クエリエラー（テーブル未存在含む）→ ログ出力 → offers.optin_price へ
 * 3. offers クエリもエラー → ログ出力 → 0 を返す
 *
 * この関数は絶対に throw しないため Webhook 処理全体は落ちない。
 * 最悪でも「金額が 0 になる」だけで、成果記録自体は壊れない。
 */
export async function getEffectiveOptinPrice(
  affiliateId: string,
  offerId: string,
): Promise<number> {
  // Step 1: 特別単価を試みる（テーブル未存在・エラーはフォールバック）
  try {
    const { data, error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .select('custom_optin_price')
      .eq('affiliate_id', affiliateId)
      .eq('offer_id', offerId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      // SQL未実行時（テーブル不存在エラー）もここに到達 → フォールバックへ
      console.warn('[pricing] affiliate_offer_rates lookup error:', error.message)
    } else if (data) {
      console.log('[pricing] Special rate applied:', data.custom_optin_price)
      return data.custom_optin_price
    }
    // data === null → 特別単価未設定 → フォールバックへ
  } catch (err) {
    console.warn('[pricing] Unexpected error in affiliate_offer_rates lookup:', err)
  }

  // Step 2: デフォルト単価（offers.optin_price）
  try {
    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('optin_price')
      .eq('id', offerId)
      .maybeSingle()

    if (error) {
      console.warn('[pricing] offers.optin_price lookup error:', error.message)
      return 0
    }
    const price = data?.optin_price ?? 0
    console.log('[pricing] Default rate applied:', price)
    return price
  } catch (err) {
    console.warn('[pricing] Unexpected error in offers lookup:', err)
    return 0 // Step 3: 最終フォールバック（成果 INSERT 自体は継続）
  }
}
