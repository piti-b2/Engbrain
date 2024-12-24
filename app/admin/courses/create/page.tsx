'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@clerk/nextjs"
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: string
  name_th: string
  name_en: string
  parent_id?: string
  sequence_number?: number
  created_at?: string
  updated_at?: string
}

export default function CreateCourse() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadError, setUploadError] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    description_th: '',
    description_en: '',
    thumbnail_url: '',
    course_type: 'video',  
    level: 'BEGINNER',     
    category_id: '',       
    status: 'DRAFT',
    is_free: false,
    expiry_date: '',
    access_duration: 0,
    price: 0
  })

  const [packages, setPackages] = useState([
    {
      name_th: 'แพ็คเกจ 1 เดือน',
      name_en: '1 Month Package',
      duration_days: 30,
      price: 990,
      original_price: 1290,
      is_default: true,
      sequence_number: 1
    },
    {
      name_th: 'แพ็คเกจ 3 เดือน',
      name_en: '3 Months Package',
      duration_days: 90,
      price: 2490,
      original_price: 3870,
      is_default: false,
      sequence_number: 2
    },
    {
      name_th: 'แพ็คเกจ 1 ปี',
      name_en: '1 Year Package',
      duration_days: 365,
      price: 7900,
      original_price: 15480,
      is_default: false,
      sequence_number: 3
    }
  ])

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!userId) {
      console.log('Not authenticated with Clerk')
      router.push('/')
      return
    }

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name_th, name_en')
          .order('sequence_number', { ascending: true })
          .order('name_th', { ascending: true })

        if (error) {
          console.error('Error details:', error)
          return
        }

        if (data) {
          setCategories(data)
          // ตั้งค่าหมวดหมู่เริ่มต้นถ้ามีข้อมูล
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, category_id: data[0].id }))
          }
        }
      } catch (error) {
        console.error('Error in fetchCategories:', error)
      }
    }

    fetchCategories()
  }, [isLoaded, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // ดึงคอร์สล่าสุดเพื่อสร้าง ID ใหม่
      const { data: latestCourse, error: fetchError } = await supabase
        .from('courses')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      // สร้าง ID ใหม่
      let newId = 'course_001'
      if (latestCourse && latestCourse.length > 0) {
        const lastNum = parseInt(latestCourse[0].id.split('_')[1])
        newId = `course_${String(lastNum + 1).padStart(3, '0')}`
      }

      // บันทึกคอร์สใหม่
      const { error: insertError } = await supabase
        .from('courses')
        .insert([{ ...formData, id: newId }])

      if (insertError) throw insertError

      // บันทึกแพ็คเกจ
      const packageData = packages.map(pkg => ({
        ...pkg,
        course_id: newId,
        status: 'ACTIVE'
      }))

      const { error: packageError } = await supabase
        .from('course_packages')
        .insert(packageData)

      if (packageError) throw packageError

      router.push('/admin/courses')
      router.refresh()
    } catch (error) {
      console.error('Error creating course:', error)
      alert('เกิดข้อผิดพลาดในการสร้างคอร์ส')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isLoaded || !userId) {
      setUploadError('กรุณาเข้าสู่ระบบก่อนอัพโหลดไฟล์')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        throw new Error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น')
      }

      // ตรวจสอบขนาดไฟล์ (จำกัดที่ 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('ขนาดไฟล์ต้องไม่เกิน 2MB')
      }

      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `course-thumbnails/${fileName}`

      // อัพโหลดไฟล์ไปยัง Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('engbrainstorage')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(uploadError.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
      }

      // สร้าง public URL สำหรับรูปภาพ
      const { data: { publicUrl } } = supabase.storage
        .from('engbrainstorage')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }))
      setPreviewUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddPackage = () => {
    setPackages([...packages, {
      name_th: '',
      name_en: '',
      duration_days: 30,
      price: 0,
      original_price: 0,
      is_default: false,
      sequence_number: packages.length + 1
    }])
  }

  const handlePackageChange = (index: number, field: string, value: any) => {
    const newPackages = packages.map((p, i) => {
      if (i === index) {
        const updatedPackage = { ...p, [field]: value };
        // ถ้าฟิลด์ที่อัพเดตคือ is_default และเป็น true
        if (field === 'is_default' && value === true) {
          setFormData(prev => ({
            ...prev,
            price: p.price
          }));
          // ทำให้แพ็คเกจอื่นไม่เป็น default
          return updatedPackage;
        }
        return updatedPackage;
      }
      // ถ้าฟิลด์ที่อัพเดตคือ is_default ให้ทำแพ็คเกจอื่นเป็น false
      if (field === 'is_default') {
        return { ...p, is_default: false };
      }
      return p;
    });
    setPackages(newPackages)
  }

  const handleRemovePackage = (index: number) => {
    const newPackages = packages.filter((_, i) => i !== index)
    // ปรับ sequence_number ใหม่
    newPackages.forEach((pkg, i) => {
      pkg.sequence_number = i + 1
    })
    setPackages(newPackages)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">สร้างคอร์สใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ชื่อคอร์ส */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อคอร์ส (ภาษาไทย)</label>
            <input
              type="text"
              name="title_th"
              value={formData.title_th}
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
              value={formData.title_en}
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
              value={formData.description_th}
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
              value={formData.description_en}
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
            <input
              type="hidden"
              name="thumbnail_url"
              value={formData.thumbnail_url}
            />
          </div>

          {/* ประเภทคอร์ส */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ประเภทคอร์ส</label>
            <select
              name="course_type"
              value={formData.course_type}
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
              value={formData.level}
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
              value={formData.category_id}
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

          {/* แพ็คเกจ */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">แพ็คเกจ</h3>
              <button
                type="button"
                onClick={handleAddPackage}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                เพิ่มแพ็คเกจ
              </button>
            </div>

            {packages.map((pkg, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">แพ็คเกจ #{index + 1}</h4>
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ลบแพ็คเกจ
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อแพ็คเกจ (ไทย)</label>
                    <input
                      type="text"
                      value={pkg.name_th}
                      onChange={(e) => handlePackageChange(index, 'name_th', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อแพ็คเกจ (อังกฤษ)</label>
                    <input
                      type="text"
                      value={pkg.name_en}
                      onChange={(e) => handlePackageChange(index, 'name_en', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ระยะเวลา (วัน)</label>
                    <input
                      type="number"
                      value={pkg.duration_days}
                      onChange={(e) => handlePackageChange(index, 'duration_days', e.target.value)}
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ราคา (บาท)</label>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ราคาก่อนลด (บาท)</label>
                    <input
                      type="number"
                      value={pkg.original_price}
                      onChange={(e) => handlePackageChange(index, 'original_price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">แพ็คเกจเริ่มต้น</label>
                    <select
                      value={pkg.is_default.toString()}
                      onChange={(e) => handlePackageChange(index, 'is_default', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="false">ไม่</option>
                      <option value="true">ใช่</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              คอร์สฟรี
            </label>
            <input
              type="checkbox"
              checked={formData.is_free}
              onChange={(e) => {
                const isFree = e.target.checked;
                setFormData({ 
                  ...formData, 
                  is_free: isFree,
                  // ถ้าเป็นคอร์สฟรี ให้ price = 0
                  price: isFree ? 0 : formData.price || 990
                });
              }}
              className="mr-2"
            />
          </div>

          {!formData.is_free && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  ราคาคอร์ส (บาท)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
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
                  value={formData.access_duration}
                  onChange={(e) => setFormData({ ...formData, access_duration: parseInt(e.target.value) })}
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
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </>
          )}

          {/* สถานะ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">สถานะ</label>
            <select
              name="status"
              value={formData.status}
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}