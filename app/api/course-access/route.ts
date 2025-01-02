import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { courseId, packageId, userId, durationDays } = body;

    console.log('Received request body:', body);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!courseId || !packageId || !userId || !durationDays) {
      console.log('Missing required fields:', { courseId, packageId, userId, durationDays });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // เรียกใช้ stored procedure ผ่าน RPC
    const { data, error } = await supabase.rpc('create_course_access', {
      p_user_id: userId,
      p_course_id: courseId,
      p_package_id: packageId,
      p_duration_days: durationDays
    });

    if (error) {
      console.error('Error calling create_course_access:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created course access:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in course-access route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
