"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardComponent from '@/components/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // อัพเดต UI หรือแสดงข้อความสำเร็จ
  }, []);

  return (
    <DashboardComponent>
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-[600px] p-6">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-green-600">การชำระเงินสำเร็จ!</h2>
            <p className="text-gray-600">
              ขอบคุณสำหรับการซื้อ Coins ของคุณ เหรียญจะถูกเพิ่มเข้าบัญชีของคุณโดยอัตโนมัติ
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-primary text-white"
            >
              กลับไปที่แดชบอร์ด
            </Button>
          </div>
        </Card>
      </div>
    </DashboardComponent>
  );
}
