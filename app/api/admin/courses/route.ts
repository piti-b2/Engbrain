import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { courseData, packages } = body

    // 1. สร้างคอร์ส
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single()

    if (courseError) {
      console.error('Error creating course:', courseError)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 400 }
      )
    }

    // 2. สร้างแพ็คเกจ
    if (packages && packages.length > 0) {
      const packageData = packages.map((pkg: any) => ({
        ...pkg,
        course_id: courseData.id,
        status: 'ACTIVE'
      }))

      const { error: packageError } = await supabase
        .from('course_packages')
        .insert(packageData)

      if (packageError) {
        console.error('Error creating packages:', packageError)
        // ลบคอร์สที่เพิ่งสร้างเพราะการสร้างแพ็คเกจล้มเหลว
        await supabase
          .from('courses')
          .delete()
          .match({ id: courseData.id })

        return NextResponse.json(
          { error: 'Failed to create course packages' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        categories (
          id,
          name_th,
          name_en
        ),
        course_packages (
          id,
          name_th,
          name_en,
          duration_days,
          price,
          original_price,
          is_default,
          sequence_number,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 400 }
      )
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error in GET /api/admin/courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}