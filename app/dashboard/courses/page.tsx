'use client'

import { CourseCard } from '@/components/courses/CourseCard';
import { DEMO_COURSES } from '@/lib/demo-data';

export default function CoursesPage() {
  const isThaiLanguage = true; // TODO: Implement language switching

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isThaiLanguage ? 'คอร์สเรียนของคุณ' : 'Your Courses'}
          </h1>
          <p className="text-gray-600">
            {isThaiLanguage 
              ? 'เรียนรู้และพัฒนาทักษะภาษาอังกฤษของคุณ' 
              : 'Learn and improve your English skills'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_COURSES.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isThaiLanguage={isThaiLanguage}
          />
        ))}
      </div>
    </div>
  );
}
