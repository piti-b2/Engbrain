import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', params.courseId)
      .single();

    if (error) throw error;

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();

  try {
    const { data, error } = await supabase
      .from('courses')
      .update(body)
      .eq('id', params.courseId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.courseId);

    if (error) throw error;

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}