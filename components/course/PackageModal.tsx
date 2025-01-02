import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Check, Timer, Sparkles, Tag, AlertCircle, Infinity, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import PaymentModal from "./PaymentModal";
import { toast } from "@/components/ui/use-toast";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSelectPackage?: (packageId: string) => void;
}

interface Package {
  id: string;
  name_th: string;
  name_en: string;
  duration_days: number;
  price: number;
  original_price: number;
  status: string;
  is_default: boolean;
  sequence_number: number;
  is_free?: boolean;
  daily_limit: number;
}

export default function PackageModal({ isOpen, onClose, courseId, onSelectPackage }: PackageModalProps) {
  const { language } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useUser();
  const supabase = createClientComponentClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // โหลดข้อมูลแพ็คเกจและเหรียญของผู้ใช้
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // โหลดข้อมูลผู้ใช้จากตาราง User
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('id, coins')
          .eq('clerkId', user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        // ถ้าไม่พบข้อมูลผู้ใช้ ให้สร้างใหม่
        if (!userData) {
          const { data: newUser, error: createError } = await supabase
            .from('User')
            .insert([{ 
              clerkId: user.id,
              coins: 0,
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return;
          }

          setUserId(newUser.id);
          setUserCoins(0);
        } else {
          setUserId(userData.id);
          setUserCoins(userData.coins);
        }

        // โหลดข้อมูลแพ็คเกจ
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('*')
          .eq('course_id', courseId)
          .eq('status', 'active')
          .order('sequence_number', { ascending: true });

        if (packagesError) {
          console.error('Error loading packages:', packagesError);
          return;
        }

        // กำหนดค่า daily_limit เริ่มต้นถ้าไม่มีค่า
        const processedPackages = packagesData.map(pkg => ({
          ...pkg,
          daily_limit: pkg.daily_limit || 5 // กำหนดค่าเริ่มต้นเป็น 5 ครั้งต่อวัน
        }));

        setPackages(processedPackages);
      } catch (error) {
        console.error('Error in loadData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, courseId, supabase]);

  // แสดงจำนวนเหรียญในส่วนบนของ modal
  useEffect(() => {
    console.log('Current user coins:', userCoins); // Debug log
  }, [userCoins]);

  // จัดการเมื่อเลือกแพ็คเกจ
  const handleSelectPackage = async (selectedPackage: Package) => {
    if (!user || !userId) return;
    setIsProcessing(true);

    try {
      // ถ้าเป็นแพ็คเกจฟรี
      if (selectedPackage.is_free) {
        // เรียกใช้ stored procedure
        const { data: result, error } = await supabase.rpc(
          'create_course_access',
          {
            p_user_id: userId, // ใช้ User.id แทน clerkId
            p_course_id: courseId,
            p_package_id: parseInt(selectedPackage.id),
            p_duration_days: selectedPackage.duration_days,
            p_is_free: true,
            p_daily_limit: selectedPackage.daily_limit
          }
        );

        if (error) {
          console.error('Error creating access:', error);
          toast({
            variant: "destructive",
            title: language === 'th' ? "เกิดข้อผิดพลาด" : "Error",
            description: error.message,
            className: "fixed top-4 right-4 z-50 w-96 bg-white shadow-lg"
          });
          return;
        }

        // ตรวจสอบผลลัพธ์จาก stored procedure
        if (!result.success) {
          toast({
            variant: "destructive",
            title: language === 'th' ? "ไม่สามารถเพิ่มสิทธิ์ได้" : "Cannot Create Access",
            description: language === 'th'
              ? "คุณมีสิทธิ์การใช้งานอยู่แล้ว"
              : "You already have access to this course"
          });
          setIsProcessing(false);
          return;
        }

        // อัพเดทสถานะและปิด modal
        if (onSelectPackage) {
          onSelectPackage(selectedPackage.id);
        }
        onClose();

        // แสดง toast success
        toast({
          title: language === 'th' ? "เพิ่มสิทธิ์สำเร็จ" : "Access Created Successfully",
          description: language === 'th'
            ? `คุณสามารถใช้งานได้ ${formatDuration(selectedPackage.duration_days)} (${selectedPackage.daily_limit} ครั้ง/วัน)`
            : `You can use this tool for ${formatDuration(selectedPackage.duration_days)} (${selectedPackage.daily_limit} times/day)`,
          className: "fixed top-4 right-4 z-50 w-96 bg-white shadow-lg"
        });

        // รีเฟรชหน้าหลังจาก 1 วินาที
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // ถ้าไม่ใช่แพ็คเกจฟรี แสดง PaymentModal
        setSelectedPackage(selectedPackage);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Error in handleSelectPackage:', error);
      toast({
        variant: "destructive",
        title: language === 'th' ? "เกิดข้อผิดพลาด" : "Error",
        description: language === 'th' 
          ? "ไม่สามารถเพิ่มสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง"
          : "Cannot create access. Please try again.",
        className: "fixed top-4 right-4 z-50 w-96 bg-white shadow-lg"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // จัดการเมื่อชำระเงินสำเร็จ
  const handlePaymentSuccess = () => {
    if (selectedPackage) {
      onSelectPackage?.(selectedPackage.id);
    }
    setShowPayment(false);
    onClose();
  };

  const formatDuration = (days: number) => {
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (days < 30) {
      return language === 'th' ? `${days} วัน` : `${days} days`;
    }
    if (months < 12) {
      return language === 'th' ? `${months} เดือน` : `${months} months`;
    }
    if (months % 12 === 0) {
      return language === 'th' ? `${years} ปี` : `${years} years`;
    }
    const remainingMonths = months % 12;
    return language === 'th' 
      ? `${years} ปี ${remainingMonths} เดือน`
      : `${years} years ${remainingMonths} months`;
  };

  const calculateDiscount = (original: number, current: number) => {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  // ปรับปรุง features ตามแพ็คเกจ
  const getPackageFeatures = (pkg: Package) => {
    if (pkg.is_free) {
      return [
        {
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          text: language === 'th' ? 'เข้าถึงคำศัพท์ได้ในบางส่วน' : 'Limited word access',
          highlight: false
        },
        {
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          text: language === 'th' 
            ? `จำกัดการเข้าถึง ${pkg.daily_limit} คำต่อวัน` 
            : `Limited to ${pkg.daily_limit} words per day`,
          highlight: false
        }
      ];
    }

    // เช็คว่าเป็นแพ็คเกจเสียเงินหรือไม่
    const isPaidPackage = pkg.price > 0;

    return [
      {
        icon: <Check className="w-5 h-5 text-green-500" />,
        text: language === 'th' 
          ? 'เข้าถึงฐานข้อมูลได้ทุกคำศัพท์'
          : 'Access to all vocabulary',
        highlight: true
      },
      {
        icon: <Check className="w-5 h-5 text-green-500" />,
        text: language === 'th' 
          ? <>
              ใช้งานได้
              <br />
              {pkg.daily_limit} คำ/วัน
            </>
          : <>
              Use up to
              <br />
              {pkg.daily_limit} words/day
            </>,
        highlight: false
      },
      {
        icon: <Check className="w-5 h-5 text-green-500" />,
        text: language === 'th' ? 'คำศัพท์อัพเดตสม่ำเสมอ' : 'Regular vocabulary updates',
        highlight: false
      }
    ];
  };

  // เรียงลำดับแพ็คเกจ
  const sortedPackages = [...packages].sort((a, b) => {
    if (a.is_free && !b.is_free) return -1;
    if (!a.is_free && b.is_free) return 1;
    return a.sequence_number - b.sequence_number;
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="fixed left-[60%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-[1200px] p-0 border-none bg-white rounded-lg shadow-xl">
          <DialogHeader className="px-8 py-6 sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-bold text-center">
              {language === 'th' ? 'เลือกแพ็คเกจที่เหมาะกับคุณ' : 'Choose Your Perfect Package'}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              {language === 'th' 
                ? 'เลือกระยะเวลาที่ต้องการเข้าถึงคอร์ส' 
                : 'Select your preferred course access duration'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-8 py-6">
            {sortedPackages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading...'}
                <Loader2 className="w-5 h-5 text-gray-500 mx-auto mt-4" />
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {sortedPackages.map((pkg) => {
                  const discount = calculateDiscount(pkg.original_price, pkg.price);
                  return (
                    <Card 
                      key={pkg.id} 
                      className={`relative flex flex-col h-full ${pkg.is_default ? 'border-blue-500 border-2' : ''}`}
                    >
                      {pkg.is_default && (
                        <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 text-sm">
                          {language === 'th' ? 'แนะนำ' : 'Popular'}
                        </div>
                      )}
                      {pkg.is_free && (
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0">
                          {language === 'th' ? 'ฟรี' : 'Free'}
                        </Badge>
                      )}
                      {/* Badge สำหรับแพ็คเกจ 3 เดือน */}
                      {pkg.duration_days === 90 && (
                        <Badge className="absolute top-3 right-3 bg-orange-500 text-white border-0">
                          {language === 'th' ? 'ขายดี' : 'Popular'}
                        </Badge>
                      )}
                      {/* Badge สำหรับแพ็คเกจ 1 ปี */}
                      {pkg.duration_days === 365 && (
                        <Badge className="absolute top-3 right-3 bg-purple-500 text-white border-0">
                          {language === 'th' ? 'สุดคุ้ม' : 'Best Value'}
                        </Badge>
                      )}
                      <div className="flex flex-col flex-1 p-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {language === 'th' ? pkg.name_th : pkg.name_en}
                          </h3>
                          
                          <div className="flex items-baseline mt-4 mb-6">
                            <span className="text-3xl font-bold text-blue-600">
                              {pkg.is_free ? (
                                language === 'th' ? 'ฟรี' : 'Free'
                              ) : (
                                `${pkg.price.toLocaleString()} 🪙`
                              )}
                            </span>
                            {discount > 0 && !pkg.is_free && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {pkg.original_price.toLocaleString()}
                              </span>
                            )}
                            {discount > 0 && !pkg.is_free && (
                              <span className="text-sm text-green-500 ml-2">
                                -{discount}%
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Timer className="w-5 h-5 text-gray-500" />
                                <span>
                                  {language === 'th' ?
                                    `ใช้งานได้ ${pkg.duration_days} วัน` :
                                    `${pkg.duration_days} days access`}
                                </span>
                              </div>
                            </div>
                            {/* แสดง features */}
                            {getPackageFeatures(pkg).map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {feature.icon}
                                <span className={`text-gray-600 ${feature.highlight ? 'font-semibold text-blue-600' : ''}`}>
                                  {feature.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-4">
                          <Button 
                            onClick={() => handleSelectPackage(pkg)}
                            className={`w-full ${pkg.is_default 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                          >
                            {language === 'th' ? 'เลือกแพ็คเกจนี้' : 'Select Package'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPackage && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          packageData={selectedPackage}
          courseId={courseId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
