interface DashboardShellProps {
  children: [React.ReactNode, React.ReactNode]
}

export function DashboardShell({ children: [sidebar, content] }: DashboardShellProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <span className="font-semibold">Learning Platform</span>
          </div>
          <div className="flex-1 overflow-auto py-2 px-4">
            {/* DashboardNav จะถูกใส่ตรงนี้ */}
            {sidebar}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {/* ส่วนเนื้อหาหลัก */}
        {content}
      </div>
    </div>
  )
}
