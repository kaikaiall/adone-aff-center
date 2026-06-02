import { cookies } from 'next/headers'
import AffiliateClientLayout from './_components/AffiliateClientLayout'

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  // サーバーサイドでCookieを読み取り、なりすましモードかどうか判定
  const isImpersonating = cookies().get('admin_impersonating')?.value === '1'

  return (
    <AffiliateClientLayout isImpersonating={isImpersonating}>
      {children}
    </AffiliateClientLayout>
  )
}
