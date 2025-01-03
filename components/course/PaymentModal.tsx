'use client';

import { useLanguage } from "../../context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "../ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: {
    id: string;
    name_th: string;
    name_en: string;
    price: number;
    duration_days: number;
    daily_limit: number;
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
  const [userId, setUserId] = useState<string>('');
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const router = useRouter();

  // ตรวจสอบการเข้าถึงคอร์ส
  const checkExistingAccess = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: language === 'th' ? "ไม่สามารถดำเนินการได้" : "Cannot Process",
        description: language === 'th'
          ? "กรุณาเข้าสู่ระบบก่อนดำเนินการ"
          : "Please login before proceeding"
      });
      return true;
    }

    try {
      const { data: accessData } = await supabase
        .from('course_access')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('access_type', 'PREMIUM')
        .eq('status', 'ACTIVE')
        .maybeSingle();

      return !!accessData;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  };

  // เช็คข้อมูลผู้ใช้เมื่อ modal เปิด
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        toast({
          variant: "destructive",
          title: language === 'th' ? "ไม่สามารถดำเนินการได้" : "Cannot Process",
          description: language === 'th'
            ? "กรุณาเข้าสู่ระบบก่อนดำเนินการ"
            : "Please login before proceeding"
        });
        onClose();
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('User')
          .select('id, coins')
          .eq('clerkId', user.id)
          .maybeSingle();

        if (error) throw error;

        if (userData) {
          setUserId(userData.id);
          setUserCoins(userData.coins);
        } else {
          // สร้างผู้ใช้ใหม่ถ้ายังไม่มีข้อมูล
          const { data: newUser, error: createError } = await supabase
            .from('User')
            .insert([{
              clerkId: user.id,
              coins: 0
            }])
            .select()
            .single();

          if (createError) throw createError;

          if (newUser) {
            setUserId(newUser.id);
            setUserCoins(0);
          }
        }

        // เช็คว่ามีสิทธิ์อยู่แล้วหรือไม่
        const hasAccess = await checkExistingAccess();
        if (hasAccess) {
          toast({
            variant: "destructive",
            title: language === 'th' ? "ไม่สามารถซื้อได้" : "Cannot Purchase",
            description: language === 'th'
              ? "คุณมีสิทธิ์การใช้งานอยู่แล้ว"
              : "You already have access to this course"
          });
          onClose();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: "destructive",
          title: language === 'th' ? "เกิดข้อผิดพลาด" : "Error",
          description: language === 'th'
            ? "ไม่สามารถดึงข้อมูลผู้ใช้ได้"
            : "Cannot fetch user data"
        });
        onClose();
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, user, supabase, courseId, language, onClose]);

  const handlePayment = async () => {
    if (!user || !userId) {
      toast({
        variant: "destructive",
        title: language === 'th' ? "ไม่สามารถดำเนินการได้" : "Cannot Process",
        description: language === 'th'
          ? "กรุณาเข้าสู่ระบบก่อนดำเนินการ"
          : "Please login before proceeding"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // ตรวจสอบว่ามีเหรียญเพียงพอ
      if (userCoins < packageData.price) {
        toast({
          variant: "destructive",
          title: language === 'th' ? "เหรียญไม่เพียงพอ" : "Insufficient Coins",
          description: language === 'th'
            ? "กรุณาเติมเหรียญก่อนดำเนินการต่อ"
            : "Please top up your coins before proceeding"
        });
        return;
      }

      // ตรวจสอบว่ามีสิทธิ์อยู่แล้วหรือไม่
      const hasAccess = await checkExistingAccess();
      if (hasAccess) {
        toast({
          variant: "destructive",
          title: language === 'th' ? "ไม่สามารถซื้อได้" : "Cannot Purchase",
          description: language === 'th'
            ? "คุณมีสิทธิ์การใช้งานอยู่แล้ว"
            : "You already have access to this course"
        });
        return;
      }

      // สร้าง transaction ID
      const transactionId = uuidv4();

      // เริ่มการทำธุรกรรม
      const { error: transactionError } = await supabase.rpc('process_course_purchase', {
        p_user_id: userId,
        p_course_id: courseId,
        p_package_id: packageData.id,
        p_transaction_id: transactionId,
        p_amount: packageData.price,
        p_duration_days: packageData.duration_days,
        p_daily_limit: packageData.daily_limit
      });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        toast({
          variant: "destructive",
          title: language === 'th' ? "เกิดข้อผิดพลาด" : "Transaction Failed",
          description: language === 'th'
            ? "ไม่สามารถดำเนินการซื้อได้ กรุณาลองใหม่อีกครั้ง"
            : "Cannot process the purchase. Please try again."
        });
        return;
      }

      // อัพเดทจำนวนเหรียญในหน้าจอ
      setUserCoins(prev => prev - packageData.price);

      // แสดง toast success
      toast({
        title: language === 'th' ? "ซื้อสำเร็จ" : "Purchase Successful",
        description: language === 'th'
          ? `คุณสามารถใช้งานได้ ${packageData.duration_days} วัน (${packageData.daily_limit} ครั้ง/วัน)`
          : `You can use this course for ${packageData.duration_days} days (${packageData.daily_limit} times/day)`
      });

      // เรียก callback onSuccess ถ้ามี
      if (onSuccess) {
        onSuccess();
      }

      // ปิด modal
      onClose();

      // รีเฟรชหน้าหลังจาก 1 วินาที
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: language === 'th' ? "เกิดข้อผิดพลาด" : "Error",
        description: language === 'th'
          ? "ไม่สามารถดำเนินการชำระเงินได้"
          : "Cannot process the payment"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {language === 'th' ? 'ยืนยันการชำระเงิน' : 'Confirm Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-6 p-4">
          {/* Package Title */}
          <div className="text-center space-y-1">
            <div className="text-xl font-medium">
              <span className="mr-2">🎁</span>
              {language === 'th' ? 'แพ็คเกจพื้นฐาน 30 วัน' : 'Basic Package 30 Days'}
            </div>
          </div>

          {/* Price Details */}
          <div className="space-y-2 font-mono">
            {/* Package Price */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {language === 'th' ? 'ราคาแพ็คเกจ' : 'Package Price'}
              </span>
              <span className="font-medium">
                {packageData.price.toLocaleString()} 🪙
              </span>
            </div>

            {/* Current Coins */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {language === 'th' ? 'เหรียญของคุณ' : 'Your Coins'}
              </span>
              <span className="font-medium">
                {userCoins.toLocaleString()} 🪙
              </span>
            </div>

            {/* Divider Line */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Remaining Coins */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {language === 'th' ? 'คงเหลือ' : 'Remaining'}
              </span>
              <span className="font-medium">
                {(userCoins - packageData.price).toLocaleString()} 🪙
              </span>
            </div>
          </div>

          {/* Insufficient Coins Warning */}
          {userCoins < packageData.price && (
            <div className="text-red-500 text-sm text-center">
              {language === 'th' 
                ? 'เหรียญไม่เพียงพอ กรุณาเติมเหรียญ'
                : 'Insufficient coins. Please top up.'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-4">
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
              className="bg-black text-white hover:bg-gray-800"
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
