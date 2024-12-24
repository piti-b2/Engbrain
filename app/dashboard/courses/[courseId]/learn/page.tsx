'use client'

import { useState } from 'react';
import { DEMO_COURSES } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LearnPageProps {
  params: {
    courseId: string;
  };
}

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={videoUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}

export default function LearnPage({ params }: LearnPageProps) {
  const course = DEMO_COURSES.find((c) => c.id === params.courseId);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  if (!course) {
    return (
      <div className="flex-1 space-y-4 p-8">
        <div className="space-y-4">
          <Link href="/dashboard/courses" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปยังหน้ารายวิชา
          </Link>
          <h1 className="text-2xl font-bold text-red-600">ไม่พบคอร์สที่ต้องการ</h1>
          <p className="text-gray-600">กรุณาตรวจสอบลิงก์อีกครั้ง</p>
        </div>
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
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      homework: null
    },
    {
      id: 2,
      title: 'บทที่ 2: พื้นฐานที่สำคัญ',
      titleEn: 'Chapter 2: Essential Basics',
      duration: '30 นาที',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      homework: {
        title: 'แบบฝึกหัดการใช้ Present Simple Tense',
        description: 'ทำแบบฝึกหัดเกี่ยวกับการใช้ Present Simple Tense จำนวน 20 ข้อ',
        dueDate: '3 วัน',
        points: 100
      }
    },
    {
      id: 3,
      title: 'บทที่ 3: การฝึกปฏิบัติ',
      titleEn: 'Chapter 3: Practical Exercises',
      duration: '45 นาที',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      homework: {
        title: 'ฝึกแต่งประโยคและบทสนทนา',
        description: 'แต่งประโยคภาษาอังกฤษ 10 ประโยค และเขียนบทสนทนาสั้นๆ 1 บทสนทนา',
        dueDate: '5 วัน',
        points: 150
      }
    },
    {
      id: 4,
      title: 'บทที่ 4: แบบทดสอบ',
      titleEn: 'Chapter 4: Assessment',
      duration: '30 นาที',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      homework: null
    }
  ];

  const currentLesson = lessons[currentLessonIndex];

  const handleLessonComplete = () => {
    if (!completedLessons.includes(currentLesson.id)) {
      setCompletedLessons([...completedLessons, currentLesson.id]);
    }
  };

  const progress = (completedLessons.length / lessons.length) * 100;

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={`/dashboard/courses/${params.courseId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปที่รายละเอียดคอร์ส
          </Link>
          <h1 className="text-2xl font-bold mb-2">{course.titleTh}</h1>
          <p className="text-gray-600">{course.titleEn}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <VideoPlayer videoUrl={currentLesson.videoUrl} />

              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{currentLesson.title}</h2>
                <p className="text-gray-600 mb-4">{currentLesson.titleEn}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{currentLesson.duration}</span>
                  </div>
                  <div className="flex gap-2">
                    {currentLesson.homework && (
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/homework/${currentLesson.id}`}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          ทำการบ้าน {currentLesson.homework.points} คะแนน
                        </Link>
                      </Button>
                    )}
                    <Button 
                      onClick={handleLessonComplete}
                      disabled={completedLessons.includes(currentLesson.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {completedLessons.includes(currentLesson.id) ? 'เรียนจบแล้ว' : 'ทำเครื่องหมายว่าเรียนจบ'}
                    </Button>
                  </div>
                </div>
                {currentLesson.homework && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">การบ้านประจำบท</h3>
                    <p className="text-blue-800 mb-1">{currentLesson.homework.title}</p>
                    <p className="text-sm text-blue-700 mb-2">{currentLesson.homework.description}</p>
                    <div className="flex justify-between items-center text-sm text-blue-600">
                      <span>กำหนดส่ง: {currentLesson.homework.dueDate}</span>
                      <span>คะแนน: {currentLesson.homework.points} คะแนน</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">ความคืบหน้า</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  เรียนไปแล้ว {completedLessons.length} จาก {lessons.length} บทเรียน
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-4">บทเรียนทั้งหมด</h3>
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      index === currentLessonIndex
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-gray-500">
                          <span>{lesson.duration}</span>
                          {lesson.homework && (
                            <span className="ml-2 text-blue-600">
                              • การบ้าน {lesson.homework.points} คะแนน
                            </span>
                          )}
                        </div>
                      </div>
                      {completedLessons.includes(lesson.id) && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
