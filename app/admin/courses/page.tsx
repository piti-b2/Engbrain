'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const SUPABASE_URL = 'btcmdvroyqwtucrqmuwl.supabase.co'

interface Category {
  name_th: string
  name_en: string
}

interface Course {
  id: string
  title_th: string
  title_en: string
  status: string
  created_at: string
  category_id: string
  category_name?: string
  price: number
  thumbnail_url?: string
  categories?: Category[]
}

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return { text: 'เปิดใช้งาน', class: 'bg-green-100 text-green-800' }
    case 'DRAFT':
      return { text: 'แบบร่าง', class: 'bg-yellow-100 text-yellow-800' }
    case 'ARCHIVED':
      return { text: 'ถูกเก็บถาวร', class: 'bg-gray-100 text-gray-800' }
    default:
      return { text: 'ไม่ทราบสถานะ', class: 'bg-red-100 text-red-800' }
  }
}

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([])
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title_th,
          title_en,
          status,
          created_at,
          category_id,
          categories (
            name_th,
            name_en
          ),
          price,
          thumbnail_url
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
        const formattedData = data.map(course => ({
          ...course,
          category_name: course.categories?.[0]?.name_th || 'ไม่ระบุหมวดหมู่'
        }))
        setCourses(formattedData || [])
      }
    }

    fetchCourses()
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการคอร์สเรียน</h1>
        <button
          onClick={() => router.push('/admin/courses/create')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          สร้างคอร์สใหม่
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รูปภาพ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชื่อคอร์ส
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หมวดหมู่
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ราคา
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่สร้าง
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex-shrink-0 h-20 w-20 relative">
                    {course.thumbnail_url && course.thumbnail_url.includes(SUPABASE_URL) ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title_th}
                        fill
                        className="object-cover rounded-lg"
                        onError={(e) => {
                          // เมื่อโหลดรูปไม่สำเร็จ จะแสดง placeholder แทน
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-400">รูปไม่ถูกต้อง</span></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">ไม่มีรูป</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{course.title_th}</div>
                  <div className="text-sm text-gray-500">{course.title_en}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{course.category_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{course.price?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusDisplay(course.status).class}`}>
                    {getStatusDisplay(course.status).text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(course.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/courses/${course.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => router.push(`/admin/courses/${course.id}/lessons`)}
                    className="text-green-600 hover:text-green-900"
                  >
                    จัดการบทเรียน
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}