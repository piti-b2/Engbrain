'use client'

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle } from 'lucide-react';
import { DEMO_COURSES } from '@/lib/demo-data';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  const course = DEMO_COURSES.find((c) => c.id === params.courseId);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showBookPurchaseDialog, setShowBookPurchaseDialog] = useState(false);
  const [isBookPurchasing, setIsBookPurchasing] = useState(false);
  const { toast } = useToast();
  const userCoins = 100; // สมมติว่าผู้ใช้มี 100 เหรียญ

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">ไม่พบคอร์สที่ต้องการ</h1>
      </div>
    );
  }

  // Mock lessons data
  const lessons = [
    {
      id: 1,
      title: 'บทที่ 1: แนะนำคอร์ส',
      titleEn: 'Chapter 1: Course Introduction',
      duration: '15 นาที',
      isPreview: true,
    },
    {
      id: 2,
      title: 'บทที่ 2: พื้นฐานที่สำคัญ',
      titleEn: 'Chapter 2: Essential Basics',
      duration: '30 นาที',
      isPreview: false,
    },
    {
      id: 3,
      title: 'บทที่ 3: การฝึกปฏิบัติ',
      titleEn: 'Chapter 3: Practical Exercises',
      duration: '45 นาที',
      isPreview: false,
    },
    {
      id: 4,
      title: 'บทที่ 4: แบบทดสอบ',
      titleEn: 'Chapter 4: Assessment',
      duration: '30 นาที',
      isPreview: false,
    }
  ];

  const handlePurchase = async () => {
    setIsPurchasing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPurchasing(false);
    setShowPurchaseDialog(false);
    toast({
      title: "สั่งซื้อสำเร็จ! ",
      description: "คุณสามารถเริ่มเรียนได้ทันที",
    });
  };

  const handleBookPurchase = async () => {
    if (!course.book) return;
    
    // ตรวจสอบว่ามีเหรียญพอหรือไม่
    if (userCoins < course.book.priceCoins) {
      toast({
        title: "เหรียญไม่พอ",
        description: `คุณมี 🪙 ${userCoins} เหรียญ ต้องใช้ 🪙 ${course.book.priceCoins} เหรียญ`,
        variant: "destructive"
      });
      setShowBookPurchaseDialog(false);
      return;
    }

    setIsBookPurchasing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsBookPurchasing(false);
    setShowBookPurchaseDialog(false);
    toast({
      title: "สั่งซื้อหนังสือสำเร็จ!",
      description: "เราจะจัดส่งหนังสือให้คุณภายใน 3-5 วันทำการ",
    });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative h-[400px] rounded-xl overflow-hidden mb-8">
          <Image
            src={course.thumbnailUrl}
            alt={course.titleTh}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center">
            <div className="container mx-auto px-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-4">
                {course.level === 'beginner' ? 'เริ่มต้น' : 
                 course.level === 'intermediate' ? 'ปานกลาง' : 'สูง'}
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">{course.titleTh}</h1>
              <p className="text-xl text-gray-200 mb-6">{course.titleEn}</p>
              <div className="flex items-center space-x-4 text-white">
                <span>{course.totalLessons} บทเรียน</span>
                <span>•</span>
                <span>{course.totalDuration} นาที</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-2xl font-bold mb-4">รายละเอียดคอร์ส</h2>
              <p className="text-gray-600 mb-6">{course.descriptionTh}</p>
              <p className="text-gray-600">{course.descriptionEn}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">เนื้อหาบทเรียน</h2>
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="border rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <p className="text-sm text-gray-500">{lesson.titleEn}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{lesson.duration}</span>
                          </div>
                          {lesson.isPreview ? (
                            <Button variant="outline" size="sm" className="flex items-center">
                              <PlayCircle className="w-4 h-4 mr-1" />
                              ดูตัวอย่าง
                            </Button>
                          ) : (
                            <Button size="sm" className="flex items-center">
                              <PlayCircle className="w-4 h-4 mr-1" />
                              เข้าเรียน
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-8">
              <div className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-green-600">คอร์สเรียนฟรี</span>
              </div>
              <Button 
                className="w-full mb-4" 
                onClick={() => window.location.href = `/dashboard/courses/${course.id}/learn`}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                เข้าเรียนเลย
              </Button>
              {course.book && (
                <Button 
                  variant="outline"
                  className="w-full mb-4" 
                  onClick={() => setShowBookPurchaseDialog(true)}
                >
                  <Image
                    src="/images/icons/book.png"
                    alt="Book"
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  สั่งซื้อหนังสือ <span className="text-lg ml-1">🪙</span> {course.book.priceCoins}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการซื้อคอร์ส</DialogTitle>
            <DialogDescription>
              คุณต้องการซื้อคอร์ส "{course.titleTh}" ในราคา {course.priceCoins} เหรียญใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handlePurchase} disabled={isPurchasing}>
              {isPurchasing ? "กำลังดำเนินการ..." : "ยืนยันการซื้อ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Purchase Dialog */}
      <Dialog open={showBookPurchaseDialog} onOpenChange={setShowBookPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งซื้อหนังสือ</DialogTitle>
            <DialogDescription>
              คุณต้องการสั่งซื้อหนังสือ "{course.book?.titleTh}" ในราคา <span className="text-lg">🪙</span> {course.book?.priceCoins} เหรียญใช่หรือไม่?
              <div className="mt-2 text-sm">
                เหรียญคงเหลือ: <span className="text-lg">🪙</span> {userCoins}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {course.book?.coverUrl && (
              <Image
                src={course.book.coverUrl}
                alt={course.book.titleTh}
                width={150}
                height={200}
                className="rounded-lg shadow-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookPurchaseDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleBookPurchase} disabled={isBookPurchasing}>
              {isBookPurchasing ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
