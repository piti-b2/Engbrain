'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import { ArrowLeft } from 'lucide-react'
import MultipleChoiceForm from '../../../components/MultipleChoiceForm'

interface Homework {
  id: number
  title: string
  description: string
  due_days: number
  questions: {
    id: number
    question_text: string
    points: number
    sequence_number: number
    choices: {
      id: number
      choice_text: string
      is_correct: boolean
      sequence_number: number
    }[]
  }[]
}

export default function MultipleChoiceHomework({ 
  params 
}: { 
  params: { 
    courseId: string
    lessonId: string 
  } 
}) {
  const [homework, setHomework] = useState<Homework | null>(null)
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
      // ดึงข้อมูลการบ้าน
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select(`
          id,
          title,
          description,
          due_days,
          questions:homework_questions(
            id,
            question_text,
            points,
            sequence_number,
            choices:question_choices(
              id,
              choice_text,
              is_correct,
              sequence_number
            )
          )
        `)
        .eq('lesson_id', params.lessonId)
        .eq('homework_type', 'multiple_choice')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (homeworkError) {
        console.error('Error fetching homework:', homeworkError)
        return
      }

      setHomework(homeworkData)
      setIsLoading(false)
    }

    fetchHomework()
  }, [isLoaded, userId, params.lessonId])

  const handleSubmit = async (data: any) => {
    try {
      // 1. ลบคำถามและตัวเลือกเก่า (ถ้ามี)
      if (homework?.questions && homework.questions.length > 0) {
        const questionIds = homework.questions.map(q => q.id)
        
        // ลบตัวเลือกก่อน (foreign key constraint)
        await supabase
          .from('multiple_choice_options')
          .delete()
          .in('question_id', questionIds)

        // ลบคำถาม
        await supabase
          .from('multiple_choice_questions')
          .delete()
          .in('id', questionIds)
      }

      // 2. สร้างคำถามใหม่
      for (const question of data.questions) {
        const { data: questionData, error: questionError } = await supabase
          .from('homework_questions')
          .insert([{
            homework_id: homework?.id,
            question_type: 'multiple_choice',
            question_text: question.question_text,
            sequence_number: question.sequence_number,
            points: question.points
          }])
          .select()
          .single()

        if (questionError) throw questionError

        // 3. สร้างตัวเลือกสำหรับคำถามนี้
        const { error: choicesError } = await supabase
          .from('question_choices')
          .insert(
            question.choices.map((choice: any) => ({
              question_id: questionData.id,
              choice_text: choice.choice_text,
              is_correct: choice.is_correct,
              sequence_number: choice.sequence_number
            }))
          )

        if (choicesError) throw choicesError
      }

      router.push(`/admin/courses/${params.courseId}/lessons`)
    } catch (error) {
      console.error('Error saving questions:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกคำถาม')
    }
  }

  if (isLoading) {
    return <div>กำลังโหลด...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/admin/courses/${params.courseId}/lessons`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปหน้ารายการบทเรียน
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-8">จัดการคำถามแบบปรนัย</h1>

      <MultipleChoiceForm
        initialData={homework ? {
          title: homework.title,
          description: homework.description,
          due_days: homework.due_days,
          questions: homework.questions.map(q => ({
            id: q.id.toString(),
            text: q.question_text,
            points: q.points,
            sequence_number: q.sequence_number,
            choices: q.choices.map(c => ({
              id: c.id.toString(),
              text: c.choice_text,
              isCorrect: c.is_correct,
              sequence_number: c.sequence_number
            }))
          }))
        } : undefined}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
