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
  minPrice?: number;
}

export default function LearningToolsPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useUser();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadToolsData = async () => {
      if (!user) return;

      // ดึงข้อมูลคอร์สประเภท Tools ทั้งหมด
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title_th, title_en, description_th, description_en, thumbnail_url')
        .eq('course_type', 'tools')
        .eq('status', 'PUBLISHED');

      if (coursesError) {
        console.error('Error loading courses:', coursesError);
        return;
      }

      if (!courses || courses.length === 0) {
        console.log('No tools courses found');
        return;
      }

      // ดึงข้อมูลการเข้าถึงของผู้ใช้
      const { data: accesses, error: accessError } = await supabase
        .from('course_access')
        .select('course_id')
        .eq('user_id', String(user.id))
        .eq('status', 'ACTIVE');

      if (accessError) {
        console.error('Error loading access:', accessError);
      }

      const accessMap = new Map(accesses?.map(access => [access.course_id, true]) || []);

      // ดึงข้อมูลราคาต่ำสุดของแต่ละคอร์ส
      const toolsData = await Promise.all(courses.map(async (course) => {
        // ดึงราคาต่ำสุดจากตาราง course_packages
        const { data: package_data, error: packageError } = await supabase
          .from('course_packages')
          .select('price')
          .eq('course_id', course.id)
          .eq('status', 'ACTIVE')
          .order('price', { ascending: true })
          .limit(1)
          .single();

        if (packageError) {
          console.error(`Error loading package for course ${course.id}:`, packageError);
        }

        const hasAccess = accessMap.has(course.id);
        const toolPath = course.id === 'course_004' ? 'phonics-dictionary' : course.id.replace('course_', '');

        console.log('Tool access check:', {
          courseId: course.id,
          userId: String(user.id),
          hasAccess,
          toolPath,
          accessMap: Object.fromEntries(accessMap)
        });

        return {
          id: course.id,
          icon: course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={language === 'th' ? course.title_th : course.title_en}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <BookA className="w-16 h-16 text-blue-600" />
          ),
          title: language === 'th' ? course.title_th : course.title_en,
          description: language === 'th' ? course.description_th : course.description_en,
          href: hasAccess ? `/dashboard/tools/${toolPath}` : `/courses/${course.id}`,
          locked: !hasAccess,
          minPrice: package_data?.price || 0
        };
      }));

      setTools(toolsData);
    };

    loadToolsData();
  }, [user, language]);

  return (
    <div className="container mx-auto p-3">
      <div className="flex items-center mb-8">
        <Lightbulb className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold">{t.learningTools}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.href}>
            <Card className={`p-8 hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer ${tool.locked ? 'opacity-70' : ''}`}>
              <div className="flex items-start mb-6">
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex-shrink-0">
                  {tool.icon}
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-semibold">
                    {tool.title}
                    {tool.locked && tool.minPrice !== undefined && tool.minPrice > 0 && (
                      <div className="flex items-center text-sm text-blue-600 mt-1 font-normal">
                        <span>{t.startingFrom} {tool.minPrice.toLocaleString()} </span>
                      </div>
                    )}
                  </h2>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{tool.description}</p>
              <div className="mt-6 flex justify-end">
                <span 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (tool.locked) {
                      setSelectedCourseId(tool.id);
                    }
                  }}
                >
                  {tool.locked ? t.buyTool : t.accessTool} →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <PackageModal 
        isOpen={!!selectedCourseId}
        onClose={() => setSelectedCourseId(null)}
        courseId={selectedCourseId || ''}
        onSelectPackage={(packageId) => {
          console.log('Selected package:', packageId);
          // TODO: Implement package selection logic
          setSelectedCourseId(null);
        }}
      />
    </div>
  );
}
