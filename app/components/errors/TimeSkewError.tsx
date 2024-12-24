"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, RefreshCcw, MessageCircle, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const TimeSkewError = () => {
  const router = useRouter();

  const handleSyncTime = () => {
    window.open('ms-settings:dateandtime');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Clock className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            พบปัญหาการซิงค์เวลา
            <div className="text-xl mt-1 text-gray-600">Time Synchronization Error</div>
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              ระบบตรวจพบว่าเวลาในเครื่องของคุณไม่ตรงกับเวลาของระบบ 
              กรุณาตรวจสอบและอัพเดตเวลาให้ถูกต้อง
            </p>
            <p className="text-gray-600 text-sm">
              System detected that your device's time is not synchronized with our server.
              Please check and update your time settings.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleSyncTime}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>อัพเดตเวลาอัตโนมัติ / Update Time Settings</span>
          </Button>

          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าแรก / Back to Home</span>
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 mb-2">
              ยังมีปัญหาอยู่ใช่ไหม? / Still having issues?
            </p>
            <Link 
              href="https://m.me/learnhub" 
              target="_blank"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ติดต่อแอดมิน / Contact Support</span>
            </Link>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Error Code: TIME_SKEW_DETECTED</div>
          <div className="text-gray-400">
            กรุณาตรวจสอบให้แน่ใจว่าตั้งค่าเวลาระบบถูกต้อง
            <br />
            Please ensure your system time is set correctly
          </div>
        </div>
      </Card>
    </div>
  );
};
