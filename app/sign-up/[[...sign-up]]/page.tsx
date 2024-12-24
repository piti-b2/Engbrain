'use client';

import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";

const translations = {
  th: {
    title: "สมัครสมาชิก",
    description: "สร้างบัญชีใหม่เพื่อใช้งานแอปพลิเคชัน",
    changeLanguage: "EN",
    copyright: "2024 Engbrain Co., Ltd. สงวนลิขสิทธิ์",
  },
  en: {
    title: "Sign Up",
    description: "Create a new account to use the application",
    changeLanguage: "TH",
    copyright: "2024 Engbrain Co., Ltd. All Rights Reserved",
  }
} as const;

type TranslationKey = keyof typeof translations.th;

export default function Page() {
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const t = (key: TranslationKey) => translations[language][key];

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[380px] bg-white">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={120}
            priority
          />
          <CardTitle className="text-2xl font-semibold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-500 hover:bg-blue-600 text-sm normal-case",
                footerAction: "hidden",
                card: "shadow-none",
              },
            }}
          />
          <div className="mt-4 text-center">
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('changeLanguage')}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {t('copyright')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
