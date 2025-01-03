"use client";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TimeSkewErrorPage() {
  const router = useRouter();

  const handleRefreshTime = () => {
    // แนะนำให้ผู้ใช้ตรวจสอบการตั้งเวลาระบบ
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <CardTitle>เกิดข้อผิดพลาดกับเวลาระบบ</CardTitle>
          <CardDescription>
            ระบบตรวจพบความไม่ตรงกันของเวลา กรุณาตรวจสอบการตั้งเวลาของคอมพิวเตอร์
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
            <p className="text-sm">
              • ตรวจสอบการตั้งเวลาอัตโนมัติของระบบ
              • ตรวจสอบเขตเวลา (Timezone)
              • ปิดและเปิด Automatic Time Sync
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> ลองใหม่อีกครั้ง
            </Button>
            <Button 
              className="w-full" 
              onClick={handleRefreshTime}
            >
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
