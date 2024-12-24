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

interface Lesson {
  id: number
  course_id: string
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  lesson_type: string
  sequence_number: number
  video_contents?: {
    video_url: string
    duration: number
  }[]
  pdf_contents?: {
    pdf_url: string
    total_pages: number
  }[]
  document_contents?: {
    document_url: string
    file_name: string
    file_size: number
  }[]
  homework_assignments?: {
    title: string
    description: string
    homework_type: string
    due_days: number
  }[]
}

interface FormData {
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  lesson_type: string
  sequence_number: number
  video_url: string
  duration: number
  pdf_url: string
  total_pages: number
  document_url: string
  file_name: string
  file_size: number
  homework_title: string
  homework_description: string
  homework_type: string
  due_days: number
}

export default function EditLesson({ params }: { params: { courseId: string, lessonId: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    title_th: '',
    title_en: '',
    description_th: '',
    description_en: '',
    lesson_type: 'video',
    sequence_number: 1,
    video_url: '',
    duration: 0,
    pdf_url: '',
    total_pages: 0,
    document_url: '',
    file_name: '',
    file_size: 0,
    homework_title: '',
    homework_description: '',
    homework_type: 'multiple_choice',
    due_days: 7,
  })

  const [originalLessonType, setOriginalLessonType] = useState<string>('')
  const [showTypeChangeWarning, setShowTypeChangeWarning] = useState(false)
  const [pendingLessonType, setPendingLessonType] = useState<string>('')

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

    const fetchData = async () => {
      try {
        // Fetch course data
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

        // Fetch lesson data
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', params.lessonId)
          .single()

        if (lessonError) {
          console.error('Error fetching lesson:', lessonError)
          return
        }

        setOriginalLessonType(lessonData.lesson_type)

        // Fetch content data based on lesson type
        const fetchContentData = async () => {
          try {
            // Video content
            const { data: videoData } = await supabase
              .from('video_contents')
              .select('*')
              .eq('lesson_id', params.lessonId)
              .maybeSingle()

            // PDF content
            const { data: pdfData } = await supabase
              .from('pdf_contents')
              .select('*')
              .eq('lesson_id', params.lessonId)
              .maybeSingle()

            // Document content
            const { data: docData } = await supabase
              .from('document_contents')
              .select('*')
              .eq('lesson_id', params.lessonId)
              .maybeSingle()

            // Homework content
            const { data: homeworkData } = await supabase
              .from('homework_assignments')
              .select('*')
              .eq('lesson_id', params.lessonId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            // Set form data with all content
            setFormData({
              title_th: lessonData.title_th || '',
              title_en: lessonData.title_en || '',
              description_th: lessonData.description_th || '',
              description_en: lessonData.description_en || '',
              lesson_type: lessonData.lesson_type || 'video',
              sequence_number: lessonData.sequence_number || 1,
              // Video content
              video_url: videoData?.video_url || '',
              duration: videoData?.duration || 0,
              // PDF content
              pdf_url: pdfData?.pdf_url || '',
              total_pages: pdfData?.total_pages || 0,
              // Document content
              document_url: docData?.document_url || '',
              file_name: docData?.file_name || '',
              file_size: docData?.file_size || 0,
              // Homework
              homework_title: homeworkData?.title || '',
              homework_description: homeworkData?.description || '',
              homework_type: homeworkData?.homework_type || 'multiple_choice',
              due_days: homeworkData?.due_days || 7,
            })
          } catch (error) {
            console.error('Error fetching content:', error)
          }
        }

        await fetchContentData()
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded && userId) {
      fetchData()
    }
  }, [isLoaded, userId, params.lessonId, supabase])

  // Handle lesson type change
  const handleLessonTypeChange = (newType: string) => {
    if (formData.lesson_type !== newType) {
      setPendingLessonType(newType)
      setShowTypeChangeWarning(true)
    }
  }

  // Confirm type change
  const confirmTypeChange = (confirmed: boolean) => {
    setShowTypeChangeWarning(false)
    if (confirmed) {
      setFormData({ ...formData, lesson_type: pendingLessonType })
    }
    setPendingLessonType('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. Update lesson
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({
          title_th: formData.title_th,
          title_en: formData.title_en,
          description_th: formData.description_th,
          description_en: formData.description_en,
          lesson_type: formData.lesson_type,
          sequence_number: formData.sequence_number
        })
        .eq('id', params.lessonId)

      if (lessonError) throw lessonError

      // 2. Handle content based on lesson type
      if (formData.lesson_type === 'homework') {
        // Check if homework type has changed
        const { data: existingHomework } = await supabase
          .from('homework_assignments')
          .select('id, homework_type')
          .eq('lesson_id', params.lessonId)
          .single()

        // ลบการบ้านเก่า
        const { data: questions } = await supabase
          .from('homework_questions')
          .select('id')
          .eq('homework_assignment_id', existingHomework?.id)

        if (existingHomework && existingHomework.homework_type !== formData.homework_type) {
          // Delete old homework questions and choices if type changed
          if (questions && questions.length > 0) {
            const questionIds = questions.map(q => q.id)
            
            // Delete choices first (foreign key constraint)
            if (existingHomework.homework_type === 'multiple_choice') {
              await supabase
                .from('question_choices')
                .delete()
                .in('question_id', questionIds)
            } else if (existingHomework.homework_type === 'fill_in') {
              await supabase
                .from('fill_in_answers')
                .delete()
                .in('question_id', questionIds)
            }

            // Then delete questions
            await supabase
              .from('homework_questions')
              .delete()
              .in('id', questionIds)
          }
        }

        // Update homework assignment
        const { error: homeworkError } = await supabase
          .from('homework_assignments')
          .update({
            title: formData.homework_title,
            description: formData.homework_description,
            homework_type: formData.homework_type,
            due_days: formData.due_days,
          })
          .eq('lesson_id', params.lessonId)

        if (homeworkError) {
          // If update fails, try insert
          const { error: insertError } = await supabase
            .from('homework_assignments')
            .insert({
              lesson_id: params.lessonId,
              title: formData.homework_title,
              description: formData.homework_description,
              homework_type: formData.homework_type,
              due_days: formData.due_days,
            })

          if (insertError) throw insertError
        }
      }

      // 3. Refresh data
      const { data: updatedHomework, error: refreshError } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('lesson_id', params.lessonId)
        .single()

      if (refreshError) {
        console.error('Error refreshing homework data:', refreshError)
      }

      // 4. Redirect back to lessons page
      router.push(`/admin/courses/${params.courseId}/lessons`)
      router.refresh()

    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('เกิดข้อผิดพลาดในการแก้ไขบทเรียน')
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
                <option value="file_upload">อัพโหลดไฟล์</option>
                <option value="fill_in">อัตนัย (เติมคำ)</option>
                <option value="mixed">ผสมผสาน</option>
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
          <h1 className="text-2xl font-bold">แก้ไขบทเรียน</h1>
        </div>
      )}

      {showTypeChangeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">ยืนยันการเปลี่ยนประเภทบทเรียน</h3>
            <p className="mb-4">การเปลี่ยนประเภทบทเรียนจะซ่อนข้อมูลของประเภทเดิมไว้ แต่ข้อมูลจะยังคงอยู่ในระบบ คุณต้องการดำเนินการต่อหรือไม่?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => confirmTypeChange(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => confirmTypeChange(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ยืนยัน
              </button>
            </div>
          </div>
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
                value={formData.lesson_type}
                onChange={(e) => handleLessonTypeChange(e.target.value)}
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
              บันทึกการแก้ไข
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
