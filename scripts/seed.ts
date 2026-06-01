import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Seeding test affiliates...')

  const affiliates = [
    { name: '田中 太郎', email: 'tanaka@test.com', account_info: '三菱UFJ銀行 渋谷支店 普通 1234567', password_hash: 'test1234' },
    { name: '佐藤 花子', email: 'sato@test.com', account_info: 'ゆうちょ銀行 記号12345 番号678901', password_hash: 'test1234' },
    { name: '山田 次郎', email: 'yamada@test.com', account_info: '三井住友銀行 新宿支店 普通 9876543', password_hash: 'test1234' },
    { name: '鈴木 美咲', email: 'suzuki@test.com', account_info: 'りそな銀行 池袋支店 普通 1122334', password_hash: 'test1234' },
    { name: '高橋 健一', email: 'takahashi@test.com', account_info: 'みずほ銀行 銀座支店 普通 5566778', password_hash: 'test1234' },
  ]

  const { data, error } = await supabase
    .from('affiliates')
    .upsert(affiliates, { onConflict: 'email', ignoreDuplicates: false })
    .select()

  if (error) {
    console.error('Error seeding affiliates:', error)
    return
  }
  console.log(`✓ ${data?.length} affiliates seeded`)

  // Seed sample offers
  const offers = [
    {
      name: 'サンプル案件A（副業入門）',
      optin_price: 500,
      has_backend: false,
      is_active: true,
      content: {
        description: 'LINEに登録するだけで副業の始め方を無料でプレゼント！初心者でも安心のサポート付き。',
        banner: '',
        lp_url: '',
        appeal_points: '・高転換率\n・無料プレゼントあり\n・サポート充実',
        target_audience: '20〜40代 副業に興味のある方',
        notes: '重複登録は成果対象外です',
      },
    },
    {
      name: 'プレミアム案件B（投資教育）',
      optin_price: 1000,
      has_backend: true,
      is_active: true,
      content: {
        description: '投資の基礎から応用まで学べる完全無料のLINE講座。登録者限定で特典プレゼント中。',
        banner: '',
        lp_url: '',
        appeal_points: '・高単価1000円/件\n・バックエンド報酬あり\n・継続率90%以上',
        target_audience: '30〜50代 資産運用に興味のある方',
        notes: '金融関連のため18歳以上のみ',
      },
    },
  ]

  const { data: offersData, error: offersError } = await supabase
    .from('offers')
    .upsert(offers, { onConflict: 'name', ignoreDuplicates: false })
    .select()

  if (offersError) {
    console.error('Error seeding offers:', offersError)
  } else {
    console.log(`✓ ${offersData?.length} offers seeded`)
  }

  console.log('\nTest login credentials:')
  affiliates.forEach((a) => {
    console.log(`  ${a.email} / ${a.password_hash}`)
  })
}

seed().catch(console.error)
