'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import Image from 'next/image'

interface Course {
  id: string
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  status: string
  category_id: string
  price: number
  thumbnail_url?: string
  course_type: string
  level: string
  is_free: boolean
  expiry_date: string | null
  access_duration: number
}

interface Category {
  id: string
  name_th: string
  name_en: string
}

interface Package {
  name_th: string
  name_en: string
  duration_days: number
  price: number
  original_price: number
  is_default: boolean
  sequence_number: number
}

export default function EditCourse({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadError, setUploadError] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { isLoaded, userId } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    
    if (!userId) {
      console.log('Not authenticated with Clerk')
      router.push('/')
      return
    }

    const fetchCourse = async () => {
      try {
        // ดึงข้อมูลคอร์ส
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', params.courseId)
          .single()

        if (courseError) throw courseError

        // ดึงข้อมูลแพ็คเกจ
        const { data: packageData, error: packageError } = await supabase
          .from('course_packages')
          .select('*')
          .eq('course_id', params.courseId)
          .order('sequence_number', { ascending: true })

        if (packageError) throw packageError

        setCourse(courseData)
        setPackages(packageData || [])
        setPreviewUrl(courseData.thumbnail_url || '')
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching course:', error)
      }
    }

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sequence_number', { ascending: true })
        .order('name_th', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      setCategories(data || [])
    }

    fetchCourse()
    fetchCategories()
  }, [isLoaded, userId, params.courseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course) return
    setIsSubmitting(true)

    try {
      // อัพเดทข้อมูลคอร์ส
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title_th: course.title_th,
          title_en: course.title_en,
          description_th: course.description_th,
          description_en: course.description_en,
          status: course.status,
          category_id: course.category_id,
          price: course.price,
          course_type: course.course_type,
          level: course.level,
          thumbnail_url: course.thumbnail_url,
          is_free: course.is_free,
          expiry_date: course.expiry_date,
          access_duration: course.access_duration
        })
        .eq('id', course.id)

      if (courseError) throw courseError

      // อัพเดทข้อมูลแพ็คเกจ
      const { error: deleteError } = await supabase
        .from('course_packages')
        .delete()
        .eq('course_id', course.id)

      if (deleteError) throw deleteError

      if (packages.length > 0) {
        const packageData = packages.map(pkg => ({
          ...pkg,
          course_id: course.id,
          status: 'ACTIVE'
        }))

        const { error: packageError } = await supabase
          .from('course_packages')
          .insert(packageData)

        if (packageError) throw packageError
      }

      router.push('/admin/courses')
      router.refresh()
    } catch (error) {
      console.error('Error updating course:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทคอร์ส')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!course) return
    if (deleteConfirmation !== course.title_th) {
      alert('ชื่อคอร์สไม่ถูกต้อง กรุณาลองใหม่')
      return
    }

    setIsDeleting(true)
    try {
      // ลบแพ็คเกจทั้งหมดของคอร์สนี้
      const { error: packageError } = await supabase
        .from('course_packages')
        .delete()
        .eq('course_id', course.id)

      if (packageError) throw packageError

      // ลบคอร์ส
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)

      if (courseError) throw courseError

      router.push('/admin/courses')
      router.refresh()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('เกิดข้อผิดพลาดในการลบคอร์ส')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!course) return
    const { name, value } = e.target
    setCourse(prev => ({
      ...prev!,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !course) return

    if (!isLoaded || !userId) {
      setUploadError('กรุณาเข้าสู่ระบบก่อนอัพโหลดไฟล์')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น')
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('ขนาดไฟล์ต้องไม่เกิน 2MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `course-thumbnails/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('engbrainstorage')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('engbrainstorage')
        .getPublicUrl(filePath)

      setCourse(prev => ({ ...prev!, thumbnail_url: publicUrl }))
      setPreviewUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  if (!course) {
    return <div className="p-6">ไม่พบคอร์สที่ต้องการ</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ส่วนหัว */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="ml-2">กลับไปหน้ารายการคอร์ส</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold">แก้ไขคอร์ส</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ชื่อคอร์ส */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อคอร์ส (ภาษาไทย)</label>
            <input
              type="text"
              name="title_th"
              value={course.title_th}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อคอร์ส (ภาษาอังกฤษ)</label>
            <input
              type="text"
              name="title_en"
              value={course.title_en}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* คำอธิบาย */}
          <div>
            <label className="block text-sm font-medium text-gray-700">คำอธิบาย (ภาษาไทย)</label>
            <textarea
              name="description_th"
              value={course.description_th}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">คำอธิบาย (ภาษาอังกฤษ)</label>
            <textarea
              name="description_en"
              value={course.description_en}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* รูปภาพปก */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">รูปภาพปก</label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-300">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Course thumbnail preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-50">
                    <span className="text-sm text-gray-500">ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <label className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                  <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                    {isUploading ? 'กำลังอัพโหลด...' : 'เลือกรูปภาพ'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF ขนาดไม่เกิน 2MB
                </p>
              </div>
            </div>
          </div>

          {/* ประเภทคอร์ส */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ประเภทคอร์ส</label>
            <select
              name="course_type"
              value={course.course_type}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="video">วิดีโอ</option>
              <option value="document">เอกสาร</option>
              <option value="mixed">ผสมผสาน</option>
              <option value="tools">เครื่องมือ</option>
            </select>
          </div>

          {/* ระดับ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ระดับ</label>
            <select
              name="level"
              value={course.level}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="BEGINNER">เริ่มต้น</option>
              <option value="INTERMEDIATE">ปานกลาง</option>
              <option value="ADVANCED">ขั้นสูง</option>
            </select>
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
            <select
              name="category_id"
              value={course.category_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_th}
                </option>
              ))}
            </select>
          </div>

          {/* คอร์สฟรี */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              คอร์สฟรี
            </label>
            <input
              type="checkbox"
              checked={course.is_free}
              onChange={(e) => {
                const isFree = e.target.checked;
                setCourse(prev => ({
                  ...prev!,
                  is_free: isFree,
                  price: isFree ? 0 : prev!.price || 990
                }))
              }}
              className="mr-2"
            />
          </div>

          {!course.is_free && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  ราคาคอร์ส (บาท)
                </label>
                <input
                  type="number"
                  name="price"
                  value={course.price}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  ระยะเวลาเข้าถึง (วัน)
                </label>
                <input
                  type="number"
                  name="access_duration"
                  value={course.access_duration}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  วันหมดอายุ
                </label>
                <input
                  type="datetime-local"
                  name="expiry_date"
                  value={course.expiry_date || ''}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              {/* แพ็คเกจ */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">แพ็คเกจ</h3>
                <div className="space-y-4">
                  {packages.map((pkg, index) => (
                    <div key={index} className="p-4 border rounded">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium">ชื่อแพ็คเกจ (ไทย)</label>
                          <input
                            type="text"
                            value={pkg.name_th}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].name_th = e.target.value
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">ชื่อแพ็คเกจ (อังกฤษ)</label>
                          <input
                            type="text"
                            value={pkg.name_en}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].name_en = e.target.value
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">ระยะเวลา (วัน)</label>
                          <input
                            type="number"
                            value={pkg.duration_days}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].duration_days = parseInt(e.target.value)
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">ราคา</label>
                          <input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].price = parseInt(e.target.value)
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">ราคาเต็ม</label>
                          <input
                            type="number"
                            value={pkg.original_price}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].original_price = parseInt(e.target.value)
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">ลำดับ</label>
                          <input
                            type="number"
                            value={pkg.sequence_number}
                            onChange={(e) => {
                              const newPackages = [...packages]
                              newPackages[index].sequence_number = parseInt(e.target.value)
                              setPackages(newPackages)
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={pkg.is_default}
                            onChange={(e) => {
                              const newPackages = packages.map((p, i) => {
                                const isNewDefault = i === index ? e.target.checked : false;
                                // ถ้าแพ็คเกจนี้ถูกตั้งเป็น default ให้อัพเดตราคาคอร์สด้วย
                                if (isNewDefault) {
                                  setCourse(prev => ({
                                    ...prev!,
                                    price: p.price
                                  }));
                                }
                                return {
                                  ...p,
                                  is_default: isNewDefault
                                };
                              });
                              setPackages(newPackages);
                            }}
                            className="form-checkbox"
                          />
                          <span className="ml-2">แพ็คเกจเริ่มต้น</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPackages = packages.filter((_, i) => i !== index)
                          setPackages(newPackages)
                        }}
                        className="mt-2 text-red-600 hover:text-red-800"
                      >
                        ลบแพ็คเกจ
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPackages([
                      ...packages,
                      {
                        name_th: '',
                        name_en: '',
                        duration_days: 30,
                        price: 990,
                        original_price: 1290,
                        is_default: packages.length === 0,
                        sequence_number: packages.length + 1
                      }
                    ])
                  }}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  เพิ่มแพ็คเกจ
                </button>
              </div>
            </>
          )}

          {/* สถานะ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">สถานะ</label>
            <select
              name="status"
              value={course.status}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">แบบร่าง</option>
              <option value="PUBLISHED">เผยแพร่</option>
              <option value="ARCHIVED">เก็บถาวร</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>

          {/* ปุ่มลบคอร์ส */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="bg-white hover:bg-red-50 text-red-600 font-bold py-2 px-4 rounded border-2 border-red-600 focus:outline-none focus:shadow-outline"
          >
            ลบคอร์สเรียน
          </button>
        </div>
      </form>

      {/* Modal ยืนยันการลบ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ ยืนยันการลบคอร์ส</h3>
            <p className="text-gray-700 mb-4">
              การลบคอร์สไม่สามารถเรียกคืนได้ และจะลบข้อมูลต่อไปนี้:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-600">
              <li>ข้อมูลคอร์สทั้งหมด</li>
              <li>แพ็คเกจทั้งหมดของคอร์ส</li>
              <li>ความสัมพันธ์กับผู้เรียน</li>
            </ul>
            <p className="text-gray-700 mb-2">
              พิมพ์ชื่อคอร์ส (ภาษาไทย) เพื่อยืนยันการลบ:
            </p>
            <p className="text-sm text-gray-500 italic mb-2">
              {course?.title_th}
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              placeholder="พิมพ์ชื่อคอร์สที่นี่"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmation !== course?.title_th}
                className={`px-4 py-2 text-white rounded ${
                  deleteConfirmation === course?.title_th
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}