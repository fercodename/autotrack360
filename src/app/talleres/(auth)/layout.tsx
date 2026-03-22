import { AuthPageLayout } from '@/components/auth/auth-page-layout'

export default function TalleresAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthPageLayout variant="taller">{children}</AuthPageLayout>
}
