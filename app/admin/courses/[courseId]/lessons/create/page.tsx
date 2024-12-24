'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import { ArrowLeft } from 'lucide-react'

interface Course {
  id: string
  title_th: string
  title_en: string
}

export default function CreateLesson({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    description_th: '',
    description_en: '',
    lesson_type: 'video',
    sequence_number: 1,
    // Video content
    video_url: '',
    duration: 0,
    // PDF content
    pdf_url: '',
    total_pages: 0,
    // Document content
    document_url: '',
    file_name: '',
    file_size: 0,
    // Homework
    homework_title: '',
    homework_description: '',
    homework_type: 'multiple_choice',
    due_days: 7,
  })

  const supabase = createClientComponentClient()
  const router = useRouter()
  const { isLoaded, userId } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    
    if (!userId) {
      console.log('Not authenticated')
      router.push('/')
      return
    }

    const fetchCourse = async () => {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title_th, title_en')
        .eq('id', params.courseId)
        .single()

      if (courseError) {
        console.error('Error fetching course:', courseError)
        return
      }

      setCourse(courseData)

      // Get the next sequence number
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('sequence_number')
        .eq('course_id', params.courseId)
        .order('sequence_number', { ascending: false })
        .limit(1)

      if (!lessonError && lessonData && lessonData.length > 0) {
        setFormData(prev => ({
          ...prev,
          sequence_number: lessonData[0].sequence_number + 1
        }))
      }

      setIsLoading(false)
    }

    fetchCourse()
  }, [isLoaded, userId, params.courseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 1. Create lesson first
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([{
          course_id: params.courseId,
          title_th: formData.title_th,
          title_en: formData.title_en,
          description_th: formData.description_th,
          description_en: formData.description_en,
          lesson_type: formData.lesson_type,
          sequence_number: formData.sequence_number,
        }])
        .select()

      if (lessonError) throw lessonError

      const lessonId = lessonData[0].id

      // 2. Create content based on lesson type
      switch (formData.lesson_type) {
        case 'video':
          const { error: videoError } = await supabase
            .from('video_contents')
            .insert([{
              lesson_id: lessonId,
              video_url: formData.video_url,
              duration: formData.duration,
            }])
          if (videoError) throw videoError
          break

        case 'pdf':
          const { error: pdfError } = await supabase
            .from('pdf_contents')
            .insert([{
              lesson_id: lessonId,
              pdf_url: formData.pdf_url,
              total_pages: formData.total_pages,
            }])
          if (pdfError) throw pdfError
          break

        case 'document':
          const { error: docError } = await supabase
            .from('document_contents')
            .insert([{
              lesson_id: lessonId,
              document_url: formData.document_url,
              file_name: formData.file_name,
              file_size: formData.file_size,
            }])
          if (docError) throw docError
          break

        case 'homework':
          const { error: homeworkError } = await supabase
            .from('homework_assignments')
            .insert([{
              lesson_id: lessonId,
              title: formData.homework_title,
              description: formData.homework_description,
              homework_type: formData.homework_type,
              due_days: formData.due_days,
            }])
          if (homeworkError) throw homeworkError
          
          // ถ้าเป็นการบ้านแบบปรนัย ให้ไปหน้าจัดการคำถาม
          if (formData.homework_type === 'multiple_choice') {
            router.push(`/admin/courses/${params.courseId}/lessons/${lessonId}/homework/multiple-choice`)
            return
          }
          // ถ้าเป็นการบ้านแบบอัตนัย ให้ไปหน้าจัดการคำถาม
          else if (formData.homework_type === 'fill_in') {
            router.push(`/admin/courses/${params.courseId}/lessons/${lessonId}/homework/fill-in`)
            return
          }
          break
      }

      router.push(`/admin/courses/${params.courseId}/lessons`)
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert('เกิดข้อผิดพลาดในการสร้างบทเรียน')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const renderContentForm = () => {
    switch (formData.lesson_type) {
      case 'video':
        return (
          <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">ข้อมูลวิดีโอ</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL วิดีโอ
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleInputChange}
                required
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความยาววิดีโอ (วินาที)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'pdf':
        return (
          <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">ข้อมูล PDF</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL ไฟล์ PDF
              </label>
              <input
                type="url"
                name="pdf_url"
                value={formData.pdf_url}
                onChange={handleInputChange}
                required
                placeholder="https://example.com/document.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนหน้า
              </label>
              <input
                type="number"
                name="total_pages"
                value={formData.total_pages}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'document':
        return (
          <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">ข้อมูลเอกสาร</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL เอกสาร
              </label>
              <input
                type="url"
                name="document_url"
                value={formData.document_url}
                onChange={handleInputChange}
                required
                placeholder="https://example.com/document.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อไฟล์
              </label>
              <input
                type="text"
                name="file_name"
                value={formData.file_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขนาดไฟล์ (bytes)
              </label>
              <input
                type="number"
                name="file_size"
                value={formData.file_size}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'homework':
        return (
          <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">ข้อมูลการบ้าน</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หัวข้อการบ้าน
              </label>
              <input
                type="text"
                name="homework_title"
                value={formData.homework_title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                name="homework_description"
                value={formData.homework_description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทการบ้าน
              </label>
              <select
                name="homework_type"
                value={formData.homework_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiple_choice">ปรนัย</option>
                <option value="fill_in">อัตนัย</option>
                <option value="file_upload">อัพโหลดไฟล์</option>
                <option value="mixed">ผสม</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กำหนดส่ง (วัน)
              </label>
              <input
                type="number"
                name="due_days"
                value={formData.due_days}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          ย้อนกลับ
        </button>
      </div>

      {course && (
        <div className="mb-6">
          <div className="text-sm text-gray-500">คอร์ส: {course.title_th}</div>
          <h1 className="text-2xl font-bold">เพิ่มบทเรียนใหม่</h1>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบทเรียน (ภาษาไทย)
              </label>
              <input
                type="text"
                name="title_th"
                value={formData.title_th}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบทเรียน (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                name="title_en"
                value={formData.title_en}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด (ภาษาไทย)
              </label>
              <textarea
                name="description_th"
                value={formData.description_th}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด (ภาษาอังกฤษ)
              </label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทบทเรียน
              </label>
              <select
                name="lesson_type"
                value={formData.lesson_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="video">วิดีโอ</option>
                <option value="pdf">PDF</option>
                <option value="document">เอกสาร</option>
                <option value="homework">การบ้าน</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับบทเรียน
              </label>
              <input
                type="number"
                name="sequence_number"
                value={formData.sequence_number}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {renderContentForm()}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              บันทึกบทเรียน
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
