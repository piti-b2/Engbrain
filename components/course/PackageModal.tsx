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
  daily_limit?: number;
}

export default function PackageModal({ isOpen, onClose, courseId, onSelectPackage }: PackageModalProps) {
  const { language } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const { user } = useUser();
  const supabase = createClientComponentClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // โหลดข้อมูลแพ็คเกจและเหรียญของผู้ใช้
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // โหลดข้อมูลเหรียญจากตาราง User
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('coins')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        setUserCoins(userData?.coins || 0);

        // โหลดข้อมูลแพ็คเกจ
        const { data: packagesData, error: packagesError } = await supabase
          .from('course_packages')
          .select('*')
          .eq('course_id', courseId)
          .order('price', { ascending: true });

        if (packagesError) throw packagesError;
        setPackages(packagesData || []);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: language === 'th'
            ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
            : 'Error loading data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, user, courseId, language]);

  // จัดการเมื่อเลือกแพ็คเกจ
  const handleSelectPackage = async (pkg: Package) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: language === 'th' 
          ? 'กรุณาเข้าสู่ระบบก่อนซื้อแพ็คเกจ'
          : 'Please login to purchase package'
      });
      return;
    }

    setSelectedPackage(pkg);
    if (pkg.is_free) {
      // ถ้าเป็นแพ็คเกจฟรี ให้เรียก onSelectPackage ทันที
      onSelectPackage?.(pkg.id);
      onClose();
    } else {
      // ถ้าเป็นแพ็คเกจเสียเงิน ให้เปิด PaymentModal
      setShowPayment(true);
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
