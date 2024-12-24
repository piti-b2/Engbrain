import DashboardComponent from '@/components/dashboard'

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardComponent>{children}</DashboardComponent>
}
