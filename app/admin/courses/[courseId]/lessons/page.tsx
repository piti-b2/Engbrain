'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import { Plus, Edit, Trash2, GripVertical, Video, FileText, FileQuestion, FileUp, FileEdit, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import dayjs from 'dayjs'
import 'dayjs/locale/th' // Import Thai locale
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Lesson {
  id: number
  course_id: string
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  sequence_number: number
  lesson_type: string
  created_at: string
  updated_at: string
  video_content?: {
    video_url: string
    duration: number
  }
  pdf_content?: {
    pdf_url: string
    total_pages: number
    audio_files: {
      page_number: number
      sequence_number: number
      audio_url: string
    }[]
  }
  document_content?: {
    document_url: string
    file_name: string
    file_size: number
  }
  homework_assignment?: {
    id: number
    title: string
    description: string
    homework_type: string
    due_days: number
    questions: {
      id: number
      question_type: string
      question_text: string
      sequence_number: number
      points: number
    }[]
  }
}

interface Course {
  id: string
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  category_id: number
  thumbnail_url: string
  status: string
  created_at: string
}

function SortableRow({ 
  lesson, 
  onDelete, 
  onEdit,
  courseId,
  router 
}: { 
  lesson: Lesson
  onDelete: (id: number) => void
  onEdit: (id: number) => void 
  courseId: string
  router: any
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button 
            className="cursor-move text-gray-400 hover:text-gray-600" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium text-gray-900">
            {lesson.sequence_number}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {lesson.lesson_type === 'video' && 'วิดีโอ'}
          {lesson.lesson_type === 'pdf' && 'เอกสาร PDF'}
          {lesson.lesson_type === 'homework' && 'แบบฝึกหัด'}
          {lesson.lesson_type === 'document' && 'เอกสาร'}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 line-clamp-2">{lesson.title_th}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 line-clamp-2">{lesson.title_en}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 line-clamp-2">{lesson.description_th}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {dayjs(lesson.created_at).locale('th').format('DD/MM/YYYY HH:mm')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {dayjs(lesson.updated_at).locale('th').format('DD/MM/YYYY HH:mm')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
        <button
          onClick={() => onEdit(lesson.id)}
          className="text-blue-600 hover:text-blue-900 inline-block"
          title="แก้ไข"
        >
          <Edit className="w-5 h-5" />
        </button>
        {/* เพิ่มปุ่มแก้ไขคำถามตามประเภทการบ้าน */}
        {lesson.lesson_type === 'homework' && lesson.homework_assignment && (
          <button
            onClick={() => {
              console.log('Lesson:', lesson);
              console.log('Homework Assignment:', lesson.homework_assignment);
              const homeworkType = lesson.homework_assignment?.homework_type;
              console.log('Homework Type:', homeworkType);
              
              if (!homeworkType) {
                alert('ไม่พบข้อมูลประเภทการบ้าน');
                return;
              }
              
              let url = `/admin/courses/${courseId}/lessons/${lesson.id}/homework/`;
              
              switch (homeworkType) {
                case 'multiple_choice':
                  url += 'multiple-choice';
                  break;
                case 'fill_in':
                  url += 'fill-in';
                  break;
                case 'file_upload':
                  url += 'file-upload';
                  break;
                case 'mixed':
                  url += 'mixed';
                  break;
                default:
                  alert(`ไม่รู้จักประเภทการบ้าน: ${homeworkType}`);
                  return;
              }
              
              router.push(url);
            }}
            className="text-green-600 hover:text-green-900 inline-block"
            title="แก้ไขคำถาม"
          >
            <FileEdit className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => onDelete(lesson.id)}
          className="text-red-600 hover:text-red-900 inline-block"
          title="ลบ"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

export default function LessonsAdmin({ params }: { params: { courseId: string } }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { isLoaded, userId } = useAuth()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }

    setLessons((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      
      // Update sequence numbers
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sequence_number: index + 1
      }))

      // Update sequence numbers in database
      updateSequenceNumbers(updatedItems)

      return updatedItems
    })
  }

  const updateSequenceNumbers = async (updatedLessons: Lesson[]) => {
    try {
      const updates = updatedLessons.map((lesson) => ({
        id: lesson.id,
        course_id: lesson.course_id,
        title_th: lesson.title_th,
        title_en: lesson.title_en,
        description_th: lesson.description_th,
        description_en: lesson.description_en,
        sequence_number: lesson.sequence_number,
        lesson_type: lesson.lesson_type
      }))

      const { error } = await supabase
        .from('lessons')
        .upsert(updates, { 
          onConflict: 'id',
          ignoreDuplicates: false,
        })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating sequence numbers:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดตลำดับบทเรียน')
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    
    if (!userId) {
      console.log('Not authenticated')
      router.push('/')
      return
    }

    const fetchCourseAndLessons = async () => {
      try {
        // Fetch course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', params.courseId)
          .single()

        if (courseError) {
          console.error('Error fetching course:', courseError)
          return
        }

        setCourse(courseData)

        // Fetch lessons data
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            video_content:video_contents(*),
            pdf_content:pdf_contents(
              *,
              audio_files:pdf_audio_files(*)
            ),
            document_content:document_contents(*)
          `)
          .eq('course_id', params.courseId)
          .order('sequence_number')

        if (lessonError) {
          console.error('Error fetching lessons:', lessonError)
          return
        }

        // แยกการ fetch homework assignments เพื่อให้ได้ homework_type
        const homeworkLessonIds = lessonData
          ?.filter(lesson => lesson.lesson_type === 'homework')
          .map(lesson => lesson.id) || []

        if (homeworkLessonIds.length > 0) {
          const { data: homeworkData, error: homeworkError } = await supabase
            .from('homework_assignments')
            .select('*')
            .in('lesson_id', homeworkLessonIds)

          if (!homeworkError && homeworkData) {
            // อัพเดท lessons ที่เป็นการบ้านด้วยข้อมูล homework_type
            const updatedLessonData = lessonData.map(lesson => {
              if (lesson.lesson_type === 'homework') {
                const homework = homeworkData.find(hw => hw.lesson_id === lesson.id)
                if (homework) {
                  return {
                    ...lesson,
                    homework_assignment: {
                      id: homework.id,
                      title: homework.title,
                      description: homework.description,
                      homework_type: homework.homework_type,
                      due_days: homework.due_days,
                      questions: homework.questions
                    }
                  }
                }
              }
              return lesson
            })
            setLessons(updatedLessonData || [])
          } else {
            console.error('Error fetching homework assignments:', homeworkError)
            setLessons(lessonData || [])
          }
        } else {
          setLessons(lessonData || [])
        }
      } catch (error) {
        console.error('Error in fetchCourseAndLessons:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseAndLessons()
  }, [isLoaded, userId, params.courseId])

  const handleCreateLesson = () => {
    router.push(`/admin/courses/${params.courseId}/lessons/create`)
  }

  const handleEditLesson = (lessonId: number) => {
    router.push(`/admin/courses/${params.courseId}/lessons/${lessonId}`)
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบทเรียนนี้?')) return

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)

    if (error) {
      console.error('Error deleting lesson:', error)
      alert('เกิดข้อผิดพลาดในการลบบทเรียน')
      return
    }

    setLessons(lessons.filter(lesson => lesson.id !== lessonId))
  }

  if (isLoading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {isLoading ? (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-2/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : course ? (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <Image
                src={course.thumbnail_url || 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image'}
                alt={course.title_th}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
                className="object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">รหัสคอร์ส: {course.id}</div>
              <h1 className="text-2xl font-bold mb-2">{course.title_th}</h1>
              <h2 className="text-xl text-gray-600 mb-4">{course.title_en}</h2>
              <p className="text-gray-600">{course.description_th}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">ไม่พบข้อมูลคอร์ส</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-4">
          <Link
            href="/admin/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปยังรายการคอร์ส
          </Link>
          <h1 className="text-2xl font-bold">จัดการบทเรียน</h1>
        </div>
        <button
          onClick={handleCreateLesson}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          เพิ่มบทเรียน
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลำดับ
                </th>
                <th scope="col" className="w-28 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อบทเรียน (ไทย)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อบทเรียน (อังกฤษ)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รายละเอียด
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่อัพเดต
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SortableContext
                items={lessons.map(lesson => lesson.id)}
                strategy={verticalListSortingStrategy}
              >
                {lessons.map((lesson) => (
                  <SortableRow
                    key={lesson.id}
                    lesson={lesson}
                    onDelete={handleDeleteLesson}
                    onEdit={handleEditLesson}
                    courseId={params.courseId}
                    router={router}
                  />
                ))}
              </SortableContext>
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    ยังไม่มีบทเรียน คลิกปุ่ม "เพิ่มบทเรียน" เพื่อเริ่มต้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}
