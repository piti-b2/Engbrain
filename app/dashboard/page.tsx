"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import dynamic from "next/dynamic";
import DashboardComponent from "@/components/dashboard";
import UserProfile from "@/components/UserProfile";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/translations";

function DashboardPage() {
  const { user } = useUser();
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <DashboardComponent>
      <div className="grid gap-6">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t.welcome}, {user?.firstName || 'Student'}
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              key: "current-courses",
              title: t.currentCourses,
              value: "2 courses"
            },
            {
              key: "learning-time",
              title: t.totalLearningTime,
              value: "15 hours"
            },
            {
              key: "total-score",
              title: t.totalScore,
              value: "1,234 points"
            }
          ].map((item) => (
            <div key={item.key} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Course Progress */}
        <div className="rounded-lg border shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t.progress}
            </h3>
            <div className="space-y-4">
              {[
                { id: 'basics', name: t.englishBasics, progress: 75 },
                { id: 'grammar', name: t.advancedGrammar, progress: 30 },
              ].map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{course.name}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Card */}
        <Link href="/dashboard/courses" 
              className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-2">{t.courses}</h2>
          <p className="text-gray-600">{t.accessLearningMaterials}</p>
        </Link>

        {/* Profile Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">{t.profile}</h2>
          <div className="flex items-center space-x-4">
            <img 
              src={user?.imageUrl} 
              alt="Profile" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <UserProfile />
      </div>
    </DashboardComponent>
  );
}

// Use dynamic import with ssr disabled
export default dynamic(() => Promise.resolve(DashboardPage), {
  ssr: false
});
