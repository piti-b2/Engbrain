'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface Question {
  id: string
  text: string
  points: number
  sequence_number: number
  correct_answer: string
  case_sensitive: boolean
}

interface FillInFormProps {
  initialData?: {
    title: string
    description: string
    due_days: number
    questions: Question[]
  }
  onSubmit: (data: any) => void
}

export default function FillInForm({ initialData, onSubmit }: FillInFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [dueDays, setDueDays] = useState(initialData?.due_days || 7)
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(),
      text: '',
      points: 1,
      sequence_number: questions.length + 1,
      correct_answer: '',
      case_sensitive: false
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
    // อัพเดตลำดับที่ของคำถามที่เหลือ
    setQuestions(prevQuestions => 
      prevQuestions.map((q, index) => ({
        ...q,
        sequence_number: index + 1
      }))
    )
  }

  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, text } : q
    ))
  }

  const updateQuestionPoints = (questionId: string, points: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, points } : q
    ))
  }

  const updateCorrectAnswer = (questionId: string, correct_answer: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, correct_answer } : q
    ))
  }

  const updateCaseSensitive = (questionId: string, case_sensitive: boolean) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, case_sensitive } : q
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!title.trim()) {
      alert('กรุณากรอกชื่อการบ้าน')
      return
    }

    if (!description.trim()) {
      alert('กรุณากรอกคำอธิบาย')
      return
    }

    // ตรวจสอบคำถามทุกข้อ
    for (const q of questions) {
      if (!q.text.trim()) {
        alert('กรุณากรอกคำถามให้ครบทุกข้อ')
        return
      }
      if (!q.correct_answer.trim()) {
        alert('กรุณากรอกคำตอบที่ถูกต้องให้ครบทุกข้อ')
        return
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      due_days: dueDays,
      homework_type: 'fill_in',
      questions: questions.map(q => ({
        question_type: 'fill_in',
        question_text: q.text.trim(),
        sequence_number: q.sequence_number,
        points: q.points,
        correct_answer: q.correct_answer.trim(),
        case_sensitive: q.case_sensitive
      }))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ข้อมูลการบ้าน */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ชื่อการบ้าน
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            คำอธิบาย
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            จำนวนวันที่ให้ทำ
          </label>
          <input
            type="number"
            value={dueDays}
            onChange={(e) => setDueDays(parseInt(e.target.value))}
            min={1}
            className="mt-1 block w-32 px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* คำถาม */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">คำถาม</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มคำถาม
          </button>
        </div>

        {questions.map((question) => (
          <div key={question.id} className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-md font-medium text-gray-900">
                ข้อที่ {question.sequence_number}
              </h4>
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                คำถาม
              </label>
              <textarea
                value={question.text}
                onChange={(e) => updateQuestionText(question.id, e.target.value)}
                rows={2}
                className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                คะแนน
              </label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => updateQuestionPoints(question.id, parseInt(e.target.value))}
                min={1}
                className="mt-1 block w-24 px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                เฉลย
              </label>
              <textarea
                value={question.correct_answer}
                onChange={(e) => updateCorrectAnswer(question.id, e.target.value)}
                rows={2}
                className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={question.case_sensitive}
                onChange={(e) => updateCaseSensitive(question.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                ตรวจสอบตัวพิมพ์ใหญ่-เล็ก
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* ปุ่มบันทึก */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          บันทึก
        </button>
      </div>
    </form>
  )
}
