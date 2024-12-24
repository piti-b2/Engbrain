'use client'

import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import DashboardComponent from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageContext"
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/components/ui/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Transaction = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

const translations = {
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
        per: 'ต่อ'
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
        per: 'per'
      }
    }
  }
};

type TagKey = 'สุดคุ้ม' | 'โบนัสสูงสุด' | 'ยอดนิยม' | 'ขายดี';

const tagMapping: Record<TagKey, { en: string; color: string; hover: string }> = {
  'สุดคุ้ม': { en: 'Best Value', color: 'bg-green-500 text-white', hover: 'bg-green-500 hover:bg-green-600' },
  'โบนัสสูงสุด': { en: 'Max Bonus', color: 'bg-purple-500 text-white', hover: 'bg-purple-500 hover:bg-purple-600' },
  'ยอดนิยม': { en: 'Popular', color: 'bg-yellow-400 text-yellow-950', hover: 'bg-yellow-500 hover:bg-yellow-600' },
  'ขายดี': { en: 'Best Seller', color: 'bg-blue-500 text-white', hover: 'bg-blue-500 hover:bg-blue-600' }
};

const getTagTranslation = (tag: string, locale: string) => {
  const mapping = tagMapping[tag as TagKey];
  return mapping ? (locale === 'en' ? mapping.en : tag) : tag;
};

const getTagStyle = (tag: string, isButton = false) => {
  const mapping = tagMapping[tag as TagKey];
  return mapping ? (isButton ? mapping.hover : mapping.color) : 'bg-gray-500 text-white';
};

export default function PaymentPage() {
  const { user } = useUser();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [userCoins, setUserCoins] = useState<number>(0);

  // ดึงข้อมูลแพ็คเกจจาก API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        setCoinPackages(data);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลแพ็คเกจได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      }
    };

    fetchPackages();
  }, []);

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
        return 'สำเร็จ';
      case 'pending':
        return 'กำลังดำเนินการ';
      case 'failed':
        return 'ไม่สำเร็จ';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
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
        const response = await fetch('/api/user/coins');
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

  const handlePayment = async (packageId: number) => {
    setLoading(true);
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'การชำระเงินล้มเหลว');
      }

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
      setLoading(false);
    }
  };

  return (
    <DashboardComponent>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.payment.title}</h1>
          <p className="text-muted-foreground">{t.payment.description}</p>
        </div>

        {/* Coin Packages */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {coinPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transform transition-all duration-200 hover:scale-105 ${
                pkg.popular ? 'border-2 border-yellow-400 shadow-lg' : ''
              }`}
            >
              {pkg.tag && (
                <div className={`absolute top-0 right-0 px-3 py-1 text-sm font-medium ${getTagStyle(pkg.tag)}`}>
                  {getTagTranslation(pkg.tag, language)}
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                <div className="space-y-4">
                  <p className="text-3xl font-bold">฿{pkg.price.toLocaleString()}</p>
                  <div className="space-y-1 min-h-[120px]">
                    <p className="text-lg">
                      <span className="text-amber-500">{t.payment.package.receive} <span className="text-2xl font-semibold">{pkg.coins.toLocaleString()} </span> </span>
                    </p>
                    {pkg.bonus > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        + {t.payment.package.bonus} <span className="font-semibold">{pkg.bonus.toLocaleString()} </span> 
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t.payment.package.averagePrice} <span className="font-medium">฿{((pkg.price) / (pkg.coins + pkg.bonus)).toFixed(2)}</span> {t.payment.package.per} 
                    </p>
                  </div>
                  <Button
                    className={`w-full ${getTagStyle(pkg.tag, true)}`}
                    variant={pkg.tag ? "default" : "outline"}
                    onClick={() => handlePayment(pkg.id)}
                    disabled={loading}
                  >
                    {loading ? t.payment.processing : t.payment.buyButton}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
            <span className="text-2xl font-bold">{userCoins.toLocaleString()} </span>
            <span className="text-muted-foreground">Coins</span>
          </div>
        </Card>
      </div>
    </DashboardComponent>
  )
}
