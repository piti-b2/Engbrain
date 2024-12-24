export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title_th: string
          title_en: string
          description_th: string
          description_en: string
          thumbnail_url: string
          course_type: string
          level: string
          category_id: string
          status: string
          is_free: boolean
          expiry_date: string | null
          access_duration: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_th: string
          title_en: string
          description_th: string
          description_en: string
          thumbnail_url: string
          course_type: string
          level: string
          category_id: string
          status: string
          is_free: boolean
          expiry_date?: string | null
          access_duration: number
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_th?: string
          title_en?: string
          description_th?: string
          description_en?: string
          thumbnail_url?: string
          course_type?: string
          level?: string
          category_id?: string
          status?: string
          is_free?: boolean
          expiry_date?: string | null
          access_duration?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name_th: string
          name_en: string
          parent_id: string | null
          sequence_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_th: string
          name_en: string
          parent_id?: string | null
          sequence_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_th?: string
          name_en?: string
          parent_id?: string | null
          sequence_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          title_th: string
          title_en: string
          description_th: string
          description_en: string
          course_id: string
          lesson_type: string
          video_url: string | null
          content: string | null
          sequence_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_th: string
          title_en: string
          description_th: string
          description_en: string
          course_id: string
          lesson_type: string
          video_url?: string | null
          content?: string | null
          sequence_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_th?: string
          title_en?: string
          description_th?: string
          description_en?: string
          course_id?: string
          lesson_type?: string
          video_url?: string | null
          content?: string | null
          sequence_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      homework: {
        Row: {
          id: string
          lesson_id: string
          question_type: string
          questions: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          question_type: string
          questions: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          question_type?: string
          questions?: any[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
