import Link from 'next/link';
import { Clock, BookOpen, Award, Coins } from 'lucide-react';

interface Course {
  id: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  thumbnailUrl: string;
  level: string;
  priceCoins: number;
  isFree: boolean;
  totalLessons: number;
  totalDuration: number;
  completionDiamonds: number;
  completionPoints: number;
}

interface CourseCardProps {
  course: Course;
  isThaiLanguage: boolean;
}

export function CourseCard({ course, isThaiLanguage }: CourseCardProps) {
  return (
    <Link href={`/dashboard/courses/${course.id}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        {/* Course Thumbnail */}
        <div className="relative aspect-square">
          <img
            src={course.thumbnailUrl}
            alt={isThaiLanguage ? course.titleTh : course.titleEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-white/90 rounded-full text-sm font-medium">
              {course.level}
            </span>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">
            {isThaiLanguage ? course.titleTh : course.titleEn}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {isThaiLanguage ? course.descriptionTh : course.descriptionEn}
          </p>

          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(course.totalDuration / 60)}h {course.totalDuration % 60}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{course.completionPoints} points</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4" />
              <span>{course.isFree ? 'Free' : `${course.priceCoins} coins`}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
