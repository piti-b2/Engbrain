'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import { ArrowLeft } from 'lucide-react'
import FillInForm from '../../../components/FillInForm'

interface HomeworkAssignment {
  id: string
  title: string
  description: string
  homework_type: string
  due_days: number
  questions: any[]
}

export default function FillInQuestions({ params }: { params: { courseId: string, lessonId: string } }) {
  const [homework, setHomework] = useState<HomeworkAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

    const fetchHomework = async () => {
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select(`
          *,
          questions:homework_questions(
            *,
            fill_in_answers(*)
          )
        `)
        .eq('lesson_id', params.lessonId)
        .single()

      if (homeworkError) {
        console.error('Error fetching homework:', homeworkError)
        return
      }

      setHomework(homeworkData)
      setIsLoading(false)
    }

    fetchHomework()
  }, [isLoaded, userId, params.lessonId])

  const handleBack = () => {
    router.push(`/admin/courses/${params.courseId}/lessons`)
  }

  const handleSubmit = async (data: any) => {
    try {
      console.log('Received data:', data);

      // ตรวจสอบข้อมูลหลักของการบ้าน
      if (!data.title?.trim()) {
        throw new Error('กรุณากรอกชื่อการบ้าน')
      }
      if (!data.description?.trim()) {
        throw new Error('กรุณากรอกคำอธิบาย')
      }
      if (!data.questions || data.questions.length === 0) {
        throw new Error('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ')
      }

      // 1. ลบคำถามและคำตอบเก่า (ถ้ามี)
      if (homework?.questions && homework.questions.length > 0) {
        const questionIds = homework.questions.map(q => q.id)
        
        // ลบคำตอบก่อน (foreign key constraint)
        await supabase
          .from('fill_in_answers')
          .delete()
          .in('question_id', questionIds)

        // ลบคำถาม
        await supabase
          .from('homework_questions')
          .delete()
          .in('id', questionIds)
      }

      // 2. อัพเดตข้อมูลการบ้าน
      const { error: homeworkError } = await supabase
        .from('homework_assignments')
        .update({
          title: data.title.trim(),
          description: data.description.trim(),
          due_days: data.due_days,
          homework_type: 'fill_in'
        })
        .eq('id', homework?.id)

      if (homeworkError) throw homeworkError

      // 3. สร้างคำถามและคำตอบใหม่
      for (const question of data.questions) {
        console.log('Processing question:', question);

        // สร้างคำถาม
        const { data: questionData, error: questionError } = await supabase
          .from('homework_questions')
          .insert({
            homework_id: homework?.id,
            question_type: 'fill_in',
            question_text: question.question_text.trim(),
            sequence_number: question.sequence_number,
            points: question.points || 1
          })
          .select()
          .single()

        if (questionError) throw questionError

        // สร้างคำตอบ
        const { error: answerError } = await supabase
          .from('fill_in_answers')
          .insert({
            question_id: questionData.id,
            correct_answer: question.correct_answer.trim(),
            case_sensitive: question.case_sensitive || false
          })

        if (answerError) throw answerError
      }

      router.push(`/admin/courses/${params.courseId}/lessons`)
    } catch (error: any) {
      console.error('Error saving questions:', error)
      alert(error.message || 'เกิดข้อผิดพลาดในการบันทึกคำถาม')
    }
  }

  if (isLoading) {
    return <div>กำลังโหลด...</div>
  }

  if (!homework) {
    return <div>Homework not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับไปหน้าบทเรียน
      </button>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{homework.title}</h1>
            <p className="text-gray-600">{homework.description}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            แบบฝึกหัดแบบเติมคำตอบ
          </div>
        </div>

        <FillInForm
          initialData={homework ? {
            title: homework.title,
            description: homework.description,
            due_days: homework.due_days,
            questions: homework.questions?.map(q => ({
              id: q.id.toString(),
              text: q.question_text,
              points: q.points,
              sequence_number: q.sequence_number,
              correct_answer: q.fill_in_answers?.[0]?.correct_answer || '',
              case_sensitive: q.fill_in_answers?.[0]?.case_sensitive || false
            })) || []
          } : undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
