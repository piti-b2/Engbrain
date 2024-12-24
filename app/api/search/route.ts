import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // ค้นหาคำในตาราง phonics_words
    const { data: words, error } = await supabase
      .from('phonics_words')
      .select('*')
      .ilike('word', word)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!words || words.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(words);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
