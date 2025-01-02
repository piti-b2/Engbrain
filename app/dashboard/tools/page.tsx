'use client';

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/translations";
import { Card } from "@/components/ui/card";
import { BookA, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@clerk/nextjs";
import React from 'react';
import PackageModal from "@/components/course/PackageModal";

interface Tool {
  id: string;
  icon: JSX.Element;
  title: string;
  description: string;
  href: string;
  locked: boolean;
  hasAccess: boolean;
  minPrice?: number;
}

export default function LearningToolsPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useUser();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  useEffect(() => {
    const loadToolsData = async () => {
      console.log('Starting loadToolsData...');
      
      if (!user) {
        console.log('No user found, returning early');
        return;
      }

      try {
        // ดึงข้อมูล user id จาก User table
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('id')
          .eq('clerkId', user.id)
          .single();

        if (userError || !userData) {
          console.error('Error getting user:', userError);
          return;
        }

        // ดึงข้อมูลคอร์สประเภท TOOLS
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title_th, title_en, description_th, description_en, thumbnail_url')
          .eq('course_type', 'TOOLS')
          .eq('status', 'PUBLISHED');

        if (coursesError) {
          console.error('Error loading courses:', coursesError);
          return;
        }

        // ดึงข้อมูลการเข้าถึงของผู้ใช้
        const { data: accesses, error: accessError } = await supabase
          .from('course_access')
          .select('course_id, expiry_date, status')  // เพิ่ม expiry_date และ status
          .eq('user_id', userData.id)
          .eq('status', 'ACTIVE');  // เพิ่มเงื่อนไข status = ACTIVE

        if (accessError) {
          console.error('Error loading access:', accessError);
          return;
        }

        // สร้าง Map ของสิทธิ์การเข้าถึงที่ยังไม่หมดอายุ
        const now = new Date();
        const accessMap = new Map(
          accesses
            ?.filter(access => new Date(access.expiry_date) > now)  // เช็ควันหมดอายุ
            .map(access => [access.course_id, true]) || []
        );

        // ดึงข้อมูลราคาและสร้าง tools array
        const toolsData = await Promise.all(courses.map(async (course) => {
          const { data: package_data } = await supabase
            .from('course_packages')
            .select('price')
            .eq('course_id', course.id)
            .eq('status', 'ACTIVE')
            .order('price', { ascending: true })
            .limit(1)
            .single();

          return {
            id: course.id,
            icon: course.id === 'course_004' ? <BookA className="w-12 h-12" /> : <Lightbulb className="w-12 h-12" />,
            title: language === 'th' ? course.title_th : course.title_en,
            description: language === 'th' ? course.description_th : course.description_en,
            href: `/dashboard/tools/${course.id === 'course_004' ? 'phonics-dictionary' : 'coming-soon'}`,
            locked: !accessMap.has(course.id),
            hasAccess: accessMap.has(course.id),  
            minPrice: package_data?.price || 0
          };
        }));

        console.log('Setting tools with data:', toolsData);
        setTools(toolsData);

      } catch (error) {
        console.error('Error in loadToolsData:', error);
      }
    };

    loadToolsData();
  }, [user, language]);

  // แก้ไขฟังก์ชัน checkAccess
  const checkAccess = async (courseId: string) => {
    if (!user) return false;

    try {
      // ดึง user id จากตาราง User ก่อน
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('id')
        .eq('clerkId', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error getting user:', userError);
        return false;
      }

      // ใช้ id จากตาราง User ในการค้นหา course_access
      const { data: accessData, error: accessError } = await supabase
        .from('course_access')
        .select('*')
        .eq('user_id', userData.id)
        .eq('course_id', courseId)
        .eq('status', 'ACTIVE');

      // ถ้าไม่มีข้อมูลหรือมี error
      if (accessError) {
        console.error('Error checking access:', accessError);
        return false;
      }

      // ถ้าไม่มีข้อมูลการเข้าถึง
      if (!accessData || accessData.length === 0) {
        return false;
      }

      // เลือกสิทธิ์ที่ยังไม่หมดอายุ
      const validAccess = accessData.find(access => {
        const expiryDate = new Date(access.expiry_date);
        const now = new Date();
        return expiryDate > now;
      });

      return !!validAccess;
    } catch (error) {
      console.error('Error in checkAccess:', error);
      return false;
    }
  };

  return (
    <div className="container mx-auto p-3">
      <div className="flex items-center mb-8">
        <Lightbulb className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold">{t.learningTools}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="mb-4">
              {tool.icon}
            </div>
            <h2 className="text-xl font-bold mb-2">{tool.title}</h2>
            <p className="text-gray-600 mb-4">{tool.description}</p>
            
            {tool.locked ? (
              // ถ้ายังไม่มีสิทธิ์
              <button
                onClick={() => {
                  setSelectedCourseId(tool.id);
                  setIsPackageModalOpen(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                {language === 'th' ? 'ซื้อแพ็คเกจ' : 'Buy Package'}
                {tool.minPrice !== undefined && tool.minPrice > 0 && ` (${tool.minPrice} coins)`}
              </button>
            ) : (
              // ถ้ามีสิทธิ์แล้ว แสดงทั้งปุ่มใช้งานและปุ่มอัพเกรด
              <div className="flex flex-col gap-2 w-full">
                <Link 
                  href={tool.href}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  {language === 'th' ? 'ใช้งาน' : 'Use Tool'}
                </Link>
                <button
                  onClick={() => {
                    setSelectedCourseId(tool.id);
                    setIsPackageModalOpen(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  {language === 'th' ? 'อัพเกรด/ซื้อเพิ่ม' : 'Upgrade/Buy More'}
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* แสดง PackageModal เมื่อ selectedCourseId มีค่า */}
      {selectedCourseId && (
        <PackageModal
          isOpen={isPackageModalOpen}
          onClose={() => {
            setIsPackageModalOpen(false);
            setSelectedCourseId(null);
          }}
          courseId={selectedCourseId}
        />
      )}
    </div>
  );
}
