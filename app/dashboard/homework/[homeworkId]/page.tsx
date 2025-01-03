'use client'

import { useState } from 'react';
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import { useToast } from "../../../../components/ui/use-toast";
import { DEMO_COURSES } from "../../../../lib/demo-data";
import DashboardComponent from "../../../../components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { ArrowLeft, Send, Clock, Save, PlayCircle, Coins, Diamond } from 'lucide-react';
import Link from 'next/link';

// เพิ่ม interface สำหรับสถานะการบ้าน
interface HomeworkStatus {
  status: 'not_started' | 'draft' | 'submitted' | 'graded';
  lastSaved?: string;
  submittedAt?: string;
  submissionCount: number;
  grade?: number;
  feedback?: string;
  isCorrect?: boolean;  // เพิ่มสถานะว่าตอบถูกหรือไม่
}

interface HomeworkPageProps {
  params: {
    homeworkId: string;
  };
}

export default function HomeworkPage({ params }: HomeworkPageProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [homeworkStatus, setHomeworkStatus] = useState<HomeworkStatus>({
    status: 'not_started',
    submissionCount: 0
  });
  const { toast } = useToast();

  // หา homework จาก DEMO_COURSES
  const lesson = DEMO_COURSES.flatMap(course => 
    course.lessons?.map(lesson => ({
      ...lesson,
      courseId: course.id,
      courseTitleTh: course.titleTh
    })) || []
  ).find(lesson => lesson.id === params.homeworkId);

  const homework = lesson?.homework;
  const courseId = lesson?.courseId;
  const courseTitleTh = lesson?.courseTitleTh;

  if (!homework || !lesson) {
    return (
      <DashboardComponent>
        <div className="flex-1 space-y-4 p-8">
          <div className="space-y-4">
            <Link href="/dashboard/courses" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปยังหน้ารายวิชา
            </Link>
            <h1 className="text-2xl font-bold text-red-600">ไม่พบการบ้านที่ต้องการ</h1>
            <p className="text-gray-600">กรุณาตรวจสอบลิงก์อีกครั้งหรือติดต่อผู้สอน</p>
          </div>
        </div>
      </DashboardComponent>
    );
  }

  // ฟังก์ชันบันทึกแบบ draft
  const handleSaveDraft = async () => {
    if (!answer.trim()) {
      toast({
        title: "ไม่มีข้อมูลที่จะบันทึก",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    
    // อัพเดทสถานะ
    setHomeworkStatus({
      ...homeworkStatus,
      lastSaved: new Date().toLocaleString('th-TH')
    });
    
    toast({
      title: "บันทึกแบบร่างแล้ว",
      description: "คุณสามารถกลับมาแก้ไขได้ก่อนส่งจริง",
    });
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: "กรุณากรอกคำตอบ",
        variant: "destructive",
      });
      return;
    }

    // ตรวจสอบว่าเป็นการส่งครั้งที่ 2 ขึ้นไปหรือไม่
    if (homeworkStatus.submissionCount > 0) {
      // ตรวจสอบจำนวนเหรียญ (ต้องมีการเชื่อมต่อกับระบบจริง)
      const userCoins = 100; // สมมติว่ามีเหรียญ 100 เหรียญ
      if (userCoins < 5) {
        toast({
          title: "เหรียญไม่เพียงพอ",
          description: "การส่งครั้งที่ 2 ขึ้นไปใช้ 5 เหรียญ คุณมีเหรียญไม่เพียงพอ",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    // เช็คประเภทการตรวจ
    if (homework.gradingType === 'exact') {
      // ตรวจแบบตายตัว
      const isCorrect = answer.trim().toLowerCase() === homework.correctAnswer.toLowerCase();
      
      // อัพเดทสถานะ
      setHomeworkStatus({
        status: 'graded',
        submittedAt: new Date().toLocaleString('th-TH'),
        submissionCount: homeworkStatus.submissionCount + 1,
        isCorrect,
        grade: isCorrect ? 100 : 0,
        feedback: isCorrect 
          ? "ยินดีด้วย! คำตอบของคุณถูกต้อง 🎉" 
          : "คำตอบยังไม่ถูกต้อง ลองใหม่อีกครั้ง"
      });

      // แสดงผลการตรวจ
      toast({
        title: isCorrect ? "ถูกต้อง! 🎉" : "ยังไม่ถูกต้อง",
        description: isCorrect 
          ? "คุณได้รับ " + homework.points + " คะแนนและเพชร 1 เม็ด"
          : "ลองทบทวนและส่งใหม่อีกครั้ง (ครั้งถัดไปใช้ 5 เหรียญ)",
        variant: isCorrect ? "default" : "destructive",
      });

    } else {
      // กรณีเป็นการตรวจแบบอื่น (manual หรือ AI)
      setHomeworkStatus({
        status: 'submitted',
        submittedAt: new Date().toLocaleString('th-TH'),
        submissionCount: homeworkStatus.submissionCount + 1
      });
      
      toast({
        title: "ส่งการบ้านเรียบร้อยแล้ว" + (homeworkStatus.submissionCount > 0 ? " (ใช้ 5 เหรียญ)" : ""),
        description: "อาจารย์จะตรวจและให้คะแนนในภายหลัง เมื่อได้คะแนนผ่านคุณจะได้รับเพชรและคะแนนประสบการณ์",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <DashboardComponent>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link 
              href={`/dashboard/courses/${courseId}/learn`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปที่บทเรียน
            </Link>
            <h1 className="text-2xl font-bold">{courseTitleTh}</h1>
            <h2 className="text-xl">{homework.title}</h2>
          </div>
          {homeworkStatus.status === 'submitted' && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
              ส่งแล้ว: {homeworkStatus.submittedAt}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{homework.title}</h3>
            <p className="text-gray-600">{homework.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                กำหนดส่ง: {new Date(homework.dueDate).toLocaleDateString('th-TH')}
              </span>
              <span className="flex items-center">
                <Diamond className="w-4 h-4 mr-1" />
                รางวัล: {homework.points} คะแนน + เพชร
              </span>
              {homeworkStatus.submissionCount > 0 && (
                <span className="flex items-center text-orange-600">
                  <Coins className="w-4 h-4 mr-1" />
                  ค่าส่งงาน: 5 เหรียญ
                </span>
              )}
              {homework.gradingType === 'exact' && (
                <span className="text-blue-600">
                  ตรวจอัตโนมัติ ทราบผลทันที
                </span>
              )}
            </div>
          </div>

          <Tabs defaultValue="answer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="answer">ทำการบ้าน</TabsTrigger>
              <TabsTrigger value="example">วิดีโอตัวอย่าง</TabsTrigger>
            </TabsList>
            <TabsContent value="answer" className="space-y-4">
              <div className="space-y-4">
                <label className="block font-medium">คำตอบของคุณ</label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  className="min-h-[200px]"
                />
                
                {/* แสดงผลการตรวจ */}
                {homeworkStatus.status === 'graded' && (
                  <div className={`p-4 rounded-md ${
                    homeworkStatus.isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <p className="font-medium">{homeworkStatus.feedback}</p>
                    {homeworkStatus.isCorrect && (
                      <p className="text-sm mt-2">
                        คุณได้รับ: {homework.points} คะแนน + เพชร 1 เม็ด
                      </p>
                    )}
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving || homeworkStatus.status === 'submitted'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || homeworkStatus.status === 'submitted'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งการบ้าน'}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="example" className="space-y-4">
              {homework.videoUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={homework.videoUrl}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <PlayCircle className="w-12 h-12 mb-2" />
                  <p>ไม่มีวิดีโอตัวอย่างสำหรับการบ้านนี้</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardComponent>
  );
}
