import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface Choice {
  id: string
  text: string
  isCorrect: boolean
  sequence_number: number
}

interface Question {
  id: string
  text: string
  points: number
  sequence_number: number
  choices: Choice[]
}

interface MultipleChoiceFormProps {
  initialData?: {
    title: string
    description: string
    due_days: number
    questions: Question[]
  }
  onSubmit: (data: any) => void
}

export default function MultipleChoiceForm({ initialData, onSubmit }: MultipleChoiceFormProps) {
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
      choices: [
        { id: Math.random().toString(), text: '', isCorrect: false, sequence_number: 1 },
        { id: Math.random().toString(), text: '', isCorrect: false, sequence_number: 2 },
        { id: Math.random().toString(), text: '', isCorrect: false, sequence_number: 3 },
        { id: Math.random().toString(), text: '', isCorrect: false, sequence_number: 4 }
      ]
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

  const updateChoiceText = (questionId: string, choiceId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            choices: q.choices.map(c => 
              c.id === choiceId ? { ...c, text } : c
            )
          }
        : q
    ))
  }

  const updateChoiceCorrect = (questionId: string, choiceId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            choices: q.choices.map(c => 
              c.id === choiceId 
                ? { ...c, isCorrect: true }
                : { ...c, isCorrect: false }
            )
          }
        : q
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      due_days: dueDays,
      homework_type: 'multiple_choice',
      questions: questions.map(q => ({
        question_type: 'multiple_choice',
        question_text: q.text,
        sequence_number: q.sequence_number,
        points: q.points,
        choices: q.choices.map(c => ({
          choice_text: c.text,
          is_correct: c.isCorrect,
          sequence_number: c.sequence_number
        }))
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                ตัวเลือก
              </label>
              {question.choices.map((choice) => (
                <div key={choice.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={choice.isCorrect}
                    onChange={() => updateChoiceCorrect(question.id, choice.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required
                  />
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => updateChoiceText(question.id, choice.id, e.target.value)}
                    placeholder={`ตัวเลือกที่ ${choice.sequence_number}`}
                    className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
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
