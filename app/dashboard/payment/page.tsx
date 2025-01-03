'use client'

import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import DashboardComponent from "../../../components/dashboard"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { useLanguage } from "../../../context/LanguageContext"
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "../../../components/ui/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Transaction = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

type TagKey = 'Start Here' | 'Basic' | 'Popular' | 'Great Deal' | 'Best Seller' | 'Platinum' | 'Diamond' | 'Ultimate';

type TranslationType = {
  th: {
    payment: {
      title: string;
      description: string;
      history: {
        title: string;
        empty: string;
      };
      balance: {
        title: string;
      };
      processing: string;
      buyButton: string;
      package: {
        receive: string;
        bonus: string;
        averagePrice: string;
        per: string;
        coin: string;
        tags: Record<TagKey, string>;
      };
    };
  };
  en: {
    payment: {
      title: string;
      description: string;
      history: {
        title: string;
        empty: string;
      };
      balance: {
        title: string;
      };
      processing: string;
      buyButton: string;
      package: {
        receive: string;
        bonus: string;
        averagePrice: string;
        per: string;
        coin: string;
        tags: Record<TagKey, string>;
      };
    };
  };
};

const translations: TranslationType = {
  th: {
    payment: {
      title: 'ชำระเงิน',
      description: 'เลือกแพ็คเกจเหรียญที่คุณต้องการ',
      history: {
        title: 'ประวัติการชำระเงิน',
        empty: 'ไม่มีประวัติการชำระเงิน'
      },
      balance: {
        title: 'ยอดเหรียญปัจจุบัน'
      },
      processing: 'กำลังดำเนินการ...',
      buyButton: 'ซื้อเลย',
      package: {
        receive: 'ได้รับ',
        bonus: 'โบนัส',
        averagePrice: 'ราคาเฉลี่ย',
        per: 'ต่อ',
        coin: 'เหรียญ',
        tags: {
          'Start Here': 'เริ่มต้น',
          'Basic': 'Basic',
          'Popular': 'ยอดนิยม',
          'Great Deal': 'ดีลพิเศษ',
          'Best Seller': 'ขายดีที่สุด',
          'Platinum': 'Platinum',
          'Diamond': 'Diamond',
          'Ultimate': 'Ultimate'
        }
      }
    }
  },
  en: {
    payment: {
      title: 'Payment',
      description: 'Select a coin package',
      history: {
        title: 'Payment History',
        empty: 'No payment history'
      },
      balance: {
        title: 'Current Balance'
      },
      processing: 'Processing...',
      buyButton: 'Buy Now',
      package: {
        receive: 'Receive',
        bonus: 'Bonus',
        averagePrice: 'Average Price',
        per: 'per',
        coin: 'coin',
        tags: {
          'Start Here': 'Start Here',
          'Basic': 'Basic',
          'Popular': 'Popular',
          'Great Deal': 'Great Deal',
          'Best Seller': 'Best Seller',
          'Platinum': 'Platinum',
          'Diamond': 'Diamond',
          'Ultimate': 'Ultimate'
        }
      }
    }
  }
};

const tagMapping: Record<TagKey, { en: string; color: string; hover: string }> = {
  'Start Here': { 
    en: 'Start Here', 
    color: 'bg-[#E0E0E0] text-black', 
    hover: 'hover:bg-[#BDBDBD]'
  },
  'Basic': {
    en: 'Basic',
    color: 'bg-yellow-300 text-black',
    hover: 'hover:bg-yellow-400'
  },
  'Popular': {
    en: 'Popular',
    color: 'bg-orange-500 text-white',
    hover: 'hover:bg-orange-600'
  },
  'Great Deal': {
    en: 'Great Deal',
    color: 'bg-gray-400 text-white',
    hover: 'hover:bg-gray-500'
  },
  'Best Seller': {
    en: 'Best Seller',
    color: 'bg-yellow-500 text-black',
    hover: 'hover:bg-yellow-600'
  },
  'Platinum': {
    en: 'Platinum',
    color: 'bg-gray-300 text-black',
    hover: 'hover:bg-gray-400'
  },
  'Diamond': {
    en: 'Diamond',
    color: 'bg-blue-500 text-white',
    hover: 'hover:bg-blue-600'
  },
  'Ultimate': {
    en: 'Ultimate',
    color: 'bg-black text-white',
    hover: 'hover:bg-gray-900'
  }
};

const getTagTranslation = (tag: TagKey | null, locale: string) => {
  if (!tag) return '';
  return locale === 'th' 
    ? translations.th.payment.package.tags[tag] || tag
    : translations.en.payment.package.tags[tag] || tag;
};

interface CoinPackage {
  id: string;
  name: string;
  price: number;
  coins: number;
  bonus: number;
  active: boolean;
  color: string;
  tag: TagKey | null;
}

const packages: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 50,
    coins: 51,
    bonus: 1,
    active: true,
    color: '#4CAF50',
    tag: 'Start Here'
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    price: 100,
    coins: 102,
    bonus: 2,
    active: true,
    color: '#FFD700',
    tag: 'Basic'
  },
  {
    id: 'bronze',
    name: 'Bronze Pack',
    price: 500,
    coins: 515,
    bonus: 15,
    active: true,
    color: '#FF5722',
    tag: 'Popular'
  },
  {
    id: 'silver',
    name: 'Silver Pack',
    price: 1000,
    coins: 1040,
    bonus: 40,
    active: true,
    color: '#9E9E9E',
    tag: 'Great Deal'
  },
  {
    id: 'gold',
    name: 'Gold Pack',
    price: 2000,
    coins: 2100,
    bonus: 100,
    active: true,
    color: '#FFC107',
    tag: 'Best Seller'
  },
  {
    id: 'platinum',
    name: 'Platinum Pack',
    price: 3000,
    coins: 3180,
    bonus: 180,
    active: true,
    color: '#E0E0E0',
    tag: 'Platinum'
  },
  {
    id: 'diamond',
    name: 'Diamond Pack',
    price: 5000,
    coins: 5350,
    bonus: 350,
    active: true,
    color: '#2196F3',
    tag: 'Diamond'
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    price: 10000,
    coins: 10800,
    bonus: 800,
    active: true,
    color: '#000000',
    tag: 'Ultimate'
  }
];

// ฟังก์ชันแปลง HEX เป็น RGB
const hexToRgb = (hex: string) => {
  // ลบ # ออกถ้ามี
  hex = hex.replace('#', '');
  
  // แปลงเป็น RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

// ฟังก์ชันคำนวณความสว่างของสี
const calculateBrightness = (r: number, g: number, b: number) => {
  // ใช้สูตร relative luminance
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// ฟังก์ชันเลือกสีตัวอักษร (ขาวหรือดำ) ตามสีพื้นหลัง
const getContrastTextColor = (backgroundColor: string) => {
  const rgb = hexToRgb(backgroundColor);
  const brightness = calculateBrightness(rgb.r, rgb.g, rgb.b);
  
  // ถ้าพื้นหลังสว่าง ใช้ตัวอักษรสีดำ
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export default function PaymentPage() {
  const { user } = useUser();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>(packages);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [isPackagesLoading, setIsPackagesLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
      case 'COMPLETED':
        return 'สำเร็จ';
      case 'pending':
      case 'PENDING':
        return 'กำลังดำเนินการ';
      case 'failed':
      case 'FAILED':
        return 'ไม่สำเร็จ';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number) => {
    return `${Math.floor(amount)} 🪙`;
  };

  useEffect(() => {
    // Fetch transaction history
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          if (response.status === 401) {
            console.error('User not authenticated');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]); // Set empty array for new users
      }
    };

    fetchTransactions();
  }, [user]);

  useEffect(() => {
    // Fetch user's current coins
    const fetchUserCoins = async () => {
      try {
        const response = await fetch('/api/coins/balance');
        if (!response.ok) {
          if (response.status === 401) {
            console.error('User not authenticated');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUserCoins(data.coins);
      } catch (error) {
        console.error('Error fetching user coins:', error);
        setUserCoins(0); // Set default value for new users
      }
    };

    fetchUserCoins();
  }, [user]);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsPackagesLoading(true);
      try {
        const response = await fetch('/api/coins/packages');
        const data = await response.json();
        if (data.packages) {
          console.log('=== Coin Packages Data ===');
          data.packages.forEach((pkg: any) => {
            console.log(`Package: ${pkg.name}`);
            console.log(`Tag: ${pkg.tag}`);
            console.log(`Color: ${pkg.color}`);
            console.log('-------------------');
          });
          console.log('Fetched packages:', data.packages); // เพิ่ม log เพื่อดูข้อมูล
          setCoinPackages(data.packages);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลแพ็คเกจได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      } finally {
        setIsPackagesLoading(false);
      }
    };
    fetchPackages();
  }, [toast]);

  const handlePayment = async (packageId: string) => {
    if (isProcessing) {
      toast({
        title: "กรุณารอสักครู่",
        description: "ระบบกำลังดำเนินการ...",
        variant: "default",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedPack = coinPackages.find(pack => pack.id === packageId);
      if (!selectedPack) {
        throw new Error('แพ็คเกจไม่ถูกต้อง');
      }

      console.log('Creating checkout session for package:', selectedPack);

      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPack.price,
          packageId: selectedPack.id,
          coinAmount: selectedPack.coins
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'การชำระเงินล้มเหลว');
      }

      const data = await response.json();
      
      console.log('Checkout session created:', data);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardComponent>
      <style jsx global>{`
        @keyframes shine {
          0% {
            background-position: -100% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .shine-border-orange {
          background: linear-gradient(90deg, #fff, #fff 40%, #f97316 50%, #fff 60%, #fff 100%);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
        .shine-border-yellow {
          background: linear-gradient(90deg, #fff, #fff 40%, #eab308 50%, #fff 60%, #fff 100%);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
      `}</style>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.payment.title}</h1>
          <p className="text-muted-foreground">{t.payment.description}</p>
        </div>

        {/* Coin Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isPackagesLoading ? (
            // แสดง loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
            ))
          ) : (
            coinPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  pkg.tag === 'Popular' 
                    ? 'border-2 border-orange-500 shadow-lg hover:shadow-orange-200 shine-border-orange'
                    : pkg.tag === 'Best Seller'
                    ? 'border-2 border-yellow-500 shadow-lg hover:shadow-yellow-200 shine-border-yellow'
                    : 'border hover:shadow-lg'
                }`}
              >
                {pkg.tag && (
                  <div 
                    className="absolute -top-1 -right-1 px-3 py-1 text-sm font-medium rounded-tr-lg rounded-bl-lg shadow-md"
                    style={{ 
                      backgroundColor: pkg.color,
                      color: getContrastTextColor(pkg.color)
                    }}
                  >
                    {getTagTranslation(pkg.tag, language)}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                  <div className="space-y-4">
                    <p className="text-3xl font-bold">฿{pkg.price.toLocaleString()}</p>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-lg">
                        <span className="text-amber-500 font-medium">{t.payment.package.receive} {pkg.coins.toLocaleString()} 🪙</span>
                      </p>
                      {pkg.bonus > 0 && (
                        <p className="text-sm text-emerald-600 font-medium">
                          + {t.payment.package.bonus} {pkg.bonus.toLocaleString()} 🪙
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t.payment.package.averagePrice} ฿{((pkg.price) / (pkg.coins + pkg.bonus)).toFixed(2)} {t.payment.package.per} {t.payment.package.coin}
                      </p>
                    </div>
                    <Button
                      style={{ 
                        backgroundColor: pkg.color,
                        color: getContrastTextColor(pkg.color)
                      }}
                      className="w-full shadow-lg font-medium hover:opacity-90 transition-opacity text-white"
                      onClick={() => handlePayment(pkg.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? t.payment.processing : t.payment.buyButton}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Transaction History */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t.payment.history.title}</h2>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center">{t.payment.history.empty}</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatAmount(transaction.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    transaction.status === 'completed' || transaction.status === 'succeeded'
                      ? 'bg-green-100 text-green-800' 
                      : transaction.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formatStatus(transaction.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* แสดงยอดเหรียญปัจจุบัน */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-2">{t.payment.balance.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{userCoins.toLocaleString()} 🪙</span>
            <span className="text-muted-foreground">Coins</span>
          </div>
        </Card>
      </div>
    </DashboardComponent>
  )
}
