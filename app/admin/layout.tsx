"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "../../components/ui/button";

const AdminHeader = () => {
  const pathname = usePathname();
  
  // ไม่แสดงปุ่มย้อนกลับในหน้าแรกของ admin
  if (pathname === "/admin") return null;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <Link href="/admin">
            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4" />
              กลับไปหน้าแอดมิน
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}