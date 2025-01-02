'use client'

import * as React from "react"
import { useState, useEffect } from 'react'
import { Bell, BookOpen, CreditCard, Home, Menu, LucidePieChart, User, Globe, MessageSquare, PlusCircle, Wallet, PanelLeftClose, PanelLeftOpen, GraduationCap, Trophy, ScrollText, Gift, Gamepad2, PenTool, History, BookA, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/translations/index'
import { useUser } from "@clerk/nextjs"
import { UserProfileMenu } from '@/components/user-profile-menu'

export default function DashboardComponent({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage()
  const t = translations[language]
  const { user } = useUser()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: 1, message: t.receivedGoldCoins, isNew: true },
    { id: 2, message: t.newCourseReady, isNew: true },
    { id: 3, message: t.longTimeNoStudy, isNew: false }
  ])
  const [userCoins, setUserCoins] = useState(0)

  // Fetch user's coins
  useEffect(() => {
    const fetchUserCoins = async () => {
      try {
        const response = await fetch('/api/coins/balance')
        const data = await response.json()
        setUserCoins(data.coins)
      } catch (error) {
        console.error('Error fetching user coins:', error)
      }
    }
    fetchUserCoins()
  }, [])

  const hasNewNotifications = notifications.some(notification => notification.isNew)

  return (
    <div className="h-full relative">
      {/* Sidebar for desktop */}
      <div className={`${isSidebarOpen ? 'md:flex' : 'md:hidden'} hidden h-full md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-yellow-200 shadow-lg shadow-gray-200/50 transition-all duration-300`}>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex justify-center px-6 py-4">
            <Link href="/dashboard">
              <img 
                src="/images/logo.png" 
                alt="Engbrain Logo" 
                className="h-20 w-auto"
              />
            </Link>
          </div>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-800">
              {t.dashboard}
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  {t.home}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/tools">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {translations[language].tools}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t.courses}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/homework">
                  <ScrollText className="mr-2 h-4 w-4" />
                  {t.homework}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/exam">
                  <PenTool className="mr-2 h-4 w-4" />
                  {t.exam}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/settings">
                  <LucidePieChart className="mr-2 h-4 w-4" />
                  {t.progress}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/scoreboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  {t.scoreboard}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/minigames">
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  {t.minigames}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/rewards">
                  <Gift className="mr-2 h-4 w-4" />
                  {t.rewards}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/certificates">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t.certificates}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/payment">
                  <Wallet className="mr-2 h-4 w-4" />
                  {t.payment.title}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/dashboard/transactions">
                  <History className="mr-2 h-4 w-4" />
                  {t.transactionHistory}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  {t.profile}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}>
                <Globe className="mr-2 h-4 w-4" />
                {language === 'th' ? 'EN' : 'TH'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className={`${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'} min-h-screen bg-gradient-to-b from-yellow-100 via-yellow-50 to-white transition-all duration-300`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full shadow-md">
          <div className="container flex h-14 items-center justify-between bg-yellow-50/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-yellow-200">
                  <div className="flex justify-center px-6 py-4">
                    <Link href="/dashboard">
                      <img 
                        src="/images/logo.png" 
                        alt="Engbrain Logo" 
                        className="h-20 w-auto mb-4"
                      />
                    </Link>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        {t.home}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/tools">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        {translations[language].tools}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/courses">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t.courses}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/homework">
                        <ScrollText className="mr-2 h-4 w-4" />
                        {t.homework}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/exam">
                        <PenTool className="mr-2 h-4 w-4" />
                        {t.exam}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/settings">
                        <LucidePieChart className="mr-2 h-4 w-4" />
                        {t.progress}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/scoreboard">
                        <Trophy className="mr-2 h-4 w-4" />
                        {t.scoreboard}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/minigames">
                        <Gamepad2 className="mr-2 h-4 w-4" />
                        {t.minigames}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/rewards">
                        <Gift className="mr-2 h-4 w-4" />
                        {t.rewards}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/certificates">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        {t.certificates}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/payment">
                        <Wallet className="mr-2 h-4 w-4" />
                        {t.payment.title}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/dashboard/transactions">
                        <History className="mr-2 h-4 w-4" />
                        {t.transactionHistory}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        {t.profile}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-800 hover:bg-yellow-300/20" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}>
                      <Globe className="mr-2 h-4 w-4" />
                      {language === 'th' ? 'EN' : 'TH'}
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* User Stats and Profile */}
            <div className="flex items-center gap-2 mr-2">
              {/* Coins */}
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border-2 border-yellow-300 shadow-sm">
                <span className="text-lg">🪙</span>
                <span className="font-medium text-yellow-800">{userCoins.toLocaleString('en-US', {
                  minimumIntegerDigits: 3,
                  useGrouping: true
                })}</span>
                <Link href="/dashboard/payment" className="ml-1">
                  <div className="bg-white rounded-full p-0.5">
                    <PlusCircle className="h-5 w-5 text-gray-900 hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasNewNotifications && (
                      <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{t.notifications}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setNotifications(prev => prev.map(n => ({...n, isNew: false})))}
                    >
                      {t.readAll}
                    </Button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">{t.noNewNotifications}</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications.map((notification) => (
                        <li key={notification.id} className="text-sm flex items-center gap-2">
                          {notification.isNew && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                          {notification.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>

              {/* User Profile */}
              <UserProfileMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 md:px-8 max-w-6xl py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
