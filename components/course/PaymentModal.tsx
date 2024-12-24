'use client';

import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from 'uuid';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: {
    id: string;
    name_th: string;
    name_en: string;
    price: number;
    duration_days: number;
  };
  courseId: string;
  onSuccess?: () => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  packageData, 
  courseId,
  onSuccess 
}: PaymentModalProps) {
  const { language } = useLanguage();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCoins, setUserCoins] = useState<number>(0);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserCoins = async () => {
      if (!user) return;
      
      const { data: userData, error } = await supabase
        .from('User')  // ใช้ตาราง User (ตัวใหญ่)
        .select('coins')
        .eq('id', user.id)
        .single();
      
      if (error) {
        toast({
          variant: "destructive",
          title: language === 'th' 
            ? 'ไม่สามารถโหลดข้อมูลเหรียญได้'
            : 'Could not load coin balance',
        });
        return;
      }

      if (userData) {
        setUserCoins(userData.coins);
      }
    };

    if (isOpen) {
      fetchUserCoins();
    }
  }, [isOpen, user, supabase, language]);

  const handlePayment = async () => {
    if (!user) return;
    
    // ตรวจสอบเหรียญไม่พอก่อนทำรายการ
    if (userCoins < packageData.price) {
      toast({
        variant: "destructive",
        title: language === 'th' 
          ? 'เหรียญไม่พอ'
          : 'Insufficient coins',
        description: language === 'th'
          ? `คุณมี ${userCoins} เหรียญ แต่ต้องใช้ ${packageData.price} เหรียญ`
          : `You have ${userCoins} coins but need ${packageData.price} coins`
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // อัพเดทเหรียญใน User ก่อน
      const { error: updateError } = await supabase
        .from('User')
        .update({ coins: userCoins - packageData.price })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // เช็คว่ามี course access อยู่แล้วหรือไม่
      const { data: existingAccess, error: queryError } = await supabase
        .from('course_access')
        .select('id, expiry_date')
        .eq('user_id', String(user.id))  
        .eq('course_id', String(courseId))  
        .eq('status', 'ACTIVE')
        .maybeSingle();

      console.log('Checking existing access:', { existingAccess, queryError });

      if (queryError) {
        console.error('Query error:', queryError);
        throw queryError;
      }

      // คำนวณวันหมดอายุ
      let newExpiryDate = new Date();
      if (existingAccess?.expiry_date) {
        const currentExpiry = new Date(existingAccess.expiry_date);
        if (currentExpiry > newExpiryDate) {
          newExpiryDate = currentExpiry;
        }
      }
      newExpiryDate.setDate(newExpiryDate.getDate() + packageData.duration_days);

      console.log('New expiry date:', newExpiryDate);

      let accessError;
      const accessData = {
        user_id: String(user.id),
        course_id: String(courseId),
        purchase_date: new Date().toISOString(),
        expiry_date: newExpiryDate.toISOString(),
        access_type: 'PURCHASED',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      console.log('Access data to insert:', accessData);

      if (existingAccess) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้ update
        const { error } = await supabase
          .from('course_access')
          .update({
            purchase_date: new Date().toISOString(),
            expiry_date: newExpiryDate.toISOString()
          })
          .eq('id', existingAccess.id);
        accessError = error;
        if (error) console.error('Update error:', error);
      } else {
        // ถ้าไม่มีข้อมูล ให้ insert ใหม่
        const { error } = await supabase
          .from('course_access')
          .insert(accessData);
        accessError = error;
        if (error) console.error('Insert error:', error);
      }

      if (accessError) throw accessError;

      // ดึงข้อมูลคอร์ส
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title_th, title_en')
        .eq('id', courseId)
        .single();

      if (courseError) throw new Error('Course not found');
      if (!courseData) throw new Error('Course not found');

      // สร้าง description ที่มีทั้งชื่อคอร์สและแพ็คเกจ
      const transactionDescription = language === 'th'
        ? `ซื้อคอร์ส: ${courseData.title_th} - แพ็คเกจ: ${packageData.name_th} (${packageData.duration_days} วัน)`
        : `Purchase course: ${courseData.title_en} - Package: ${packageData.name_en} (${packageData.duration_days} days)`;

      console.log('Transaction description:', transactionDescription);

      // บันทึก transaction หลังจากทำรายการสำเร็จ
      const now = new Date().toISOString();  // ใช้เวลาเดียวกันทั้ง createdAt และ updatedAt
      const { error: transactionError } = await supabase
        .from('CoinTransaction')
        .insert({
          id: uuidv4(),
          userId: user.id,
          amount: -packageData.price,
          balance: userCoins - packageData.price,
          type: 'DEBIT',
          reason: 'PURCHASE',
          description: transactionDescription,
          status: 'COMPLETED',
          createdAt: now,
          updatedAt: now  // เพิ่ม updatedAt
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      toast({
        title: language === 'th' 
          ? 'ชำระเงินสำเร็จ!' 
          : 'Payment successful!',
        description: language === 'th'
          ? 'คุณสามารถเข้าเรียนได้ทันที'
          : 'You can start learning now'
      });
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === 'th'
          ? 'เกิดข้อผิดพลาด'
          : 'Error',
        description: error.message || (language === 'th' ? 'เหรียญไม่เพียงพอ' : 'Insufficient coins')
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'th' ? 'ยืนยันการชำระเงิน' : 'Confirm Payment'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th' 
              ? 'กรุณาตรวจสอบรายละเอียดการชำระเงินของคุณ' 
              : 'Please review your payment details'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              {language === 'th' ? packageData.name_th : packageData.name_en}
            </h3>
            <p className="text-sm text-gray-500">
              {language === 'th' 
                ? `${Math.ceil(packageData.duration_days / 30)} เดือน` 
                : `${Math.ceil(packageData.duration_days / 30)} months`}
            </p>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-500">
                {language === 'th' ? 'เหรียญของคุณ:' : 'Your coins:'} 
                <span className="font-semibold"> {userCoins.toLocaleString()}</span>
              </p>
              <p className="text-xl font-bold text-primary">
                {packageData.price.toLocaleString()} {language === 'th' ? 'เหรียญ' : 'coins'}
              </p>
              {userCoins < packageData.price && (
                <p className="text-sm text-red-500">
                  {language === 'th' 
                    ? 'เหรียญไม่เพียงพอ กรุณาเติมเหรียญ' 
                    : 'Insufficient coins. Please top up.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || userCoins < packageData.price}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...'}
                </>
              ) : (
                language === 'th' ? 'ยืนยันการชำระเงิน' : 'Confirm Payment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
