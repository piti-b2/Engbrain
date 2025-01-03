import Dashboard from "../../../components/dashboard"

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Dashboard>{children}</Dashboard>
}
