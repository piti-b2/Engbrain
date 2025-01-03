"use client";

import { Card } from "@/components/ui/card"; // @/components/ui/card
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  Coins, 
  BookCheck,
  MessageSquare,
  Settings,
  LineChart,
  ChevronLeft,
  Home
} from "lucide-react";
import Link from "next/link";

interface AdminMenuItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AdminMenuItem = ({ href, icon, title, description }: AdminMenuItemProps) => (
  <Link href={href} className="block">
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 hover:border-blue-200">
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  </Link>
);

const AdminDashboard = () => {
  const menuItems = [
    {
      href: "/admin/courses",
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      title: "จัดการคอร์สเรียน",
      description: "สร้าง แก้ไข และจัดการคอร์สเรียนและบทเรียน"
    },
    {
      href: "/admin/users",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "จัดการผู้ใช้",
      description: "ดูข้อมูลผู้ใช้ จัดการสิทธิ์ และแก้ไขข้อมูล"
    },
    {
      href: "/admin/coins",
      icon: <Coins className="w-6 h-6 text-blue-600" />,
      title: "จัดการเหรียญ",
      description: "ตรวจสอบและจัดการธุรกรรมเหรียญของผู้ใช้"
    },
    {
      href: "/admin/homework",
      icon: <BookCheck className="w-6 h-6 text-blue-600" />,
      title: "จัดการการบ้าน",
      description: "ตรวจการบ้าน ให้คะแนน และจัดการข้อมูลการบ้าน"
    },
    {
      href: "/admin/messages",
      icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
      title: "ข้อความติดต่อ",
      description: "จัดการข้อความติดต่อจากผู้ใช้และการแจ้งเตือน"
    },
    {
      href: "/admin/analytics",
      icon: <LineChart className="w-6 h-6 text-blue-600" />,
      title: "วิเคราะห์ข้อมูล",
      description: "ดูสถิติและวิเคราะห์ข้อมูลการใช้งานระบบ"
    },
    {
      href: "/admin/settings",
      icon: <Settings className="w-6 h-6 text-blue-600" />,
      title: "ตั้งค่าระบบ",
      description: "จัดการการตั้งค่าระบบและค่าคงที่ต่างๆ"
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แอดมินแดชบอร์ด</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <AdminMenuItem key={index} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
