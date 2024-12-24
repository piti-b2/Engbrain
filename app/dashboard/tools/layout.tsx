'use client'

import DashboardComponent from "@/components/dashboard"

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardComponent>{children}</DashboardComponent>
}
