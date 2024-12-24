export const DEMO_COURSES = [
  {
    id: '1',
    titleTh: 'ภาษาอังกฤษพื้นฐานสำหรับผู้เริ่มต้น',
    titleEn: 'Basic English for Beginners',
    descriptionTh: 'เรียนรู้พื้นฐานภาษาอังกฤษที่จำเป็นสำหรับการสื่อสารในชีวิตประจำวัน',
    descriptionEn: 'Learn essential English basics for daily communication',
    thumbnailUrl: '/images/courses/basic-english.jpg',
    previewVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'beginner',
    priceCoins: 0,
    isFree: true,
    totalLessons: 10,
    totalDuration: 300,
    completionDiamonds: 50,
    completionPoints: 1000,
    lessons: [
      {
        id: '1',
        titleTh: 'บทที่ 1: การทักทายและแนะนำตัว',
        titleEn: 'Chapter 1: Greetings and Introductions',
        homework: {
          title: 'แบบฝึกหัดการทักทาย',
          description: 'ฝึกเขียนประโยคทักทายและแนะนำตัวเอง',
          dueDate: '2024-02-01',
          points: 100,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          submissionType: 'text',
          allowedFileTypes: ['txt', 'doc', 'docx'],
          maxFileSize: 5,
          gradingType: 'exact',
          correctAnswer: 'Hello, my name is [Your Name].'
        }
      },
      {
        id: '2',
        titleTh: 'บทที่ 2: การสนทนาในชีวิตประจำวัน',
        titleEn: 'Chapter 2: Daily Conversations',
        homework: {
          title: 'แบบฝึกหัดการสนทนา',
          description: 'เขียนบทสนทนาในสถานการณ์ที่กำหนด',
          dueDate: '2024-02-08',
          points: 150,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          submissionType: 'text',
          allowedFileTypes: ['txt', 'doc', 'docx'],
          maxFileSize: 5,
          gradingType: 'manual',
          correctAnswer: ''
        }
      }
    ],
    book: {
      titleTh: 'คู่มือภาษาอังกฤษพื้นฐาน',
      titleEn: 'Basic English Handbook',
      priceCoins: 50,
      coverUrl: '/images/books/basic-english.jpg'
    }
  },
  {
    id: '2',
    titleTh: 'การสนทนาภาษาอังกฤษขั้นกลาง',
    titleEn: 'Intermediate English Conversation',
    descriptionTh: 'พัฒนาทักษะการสนทนาภาษาอังกฤษให้เป็นธรรมชาติมากขึ้น',
    descriptionEn: 'Improve your English conversation skills to sound more natural',
    thumbnailUrl: '/images/courses/conversation.jpg',
    previewVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'intermediate',
    priceCoins: 100,
    isFree: false,
    totalLessons: 15,
    totalDuration: 450,
    completionDiamonds: 100,
    completionPoints: 2000,
    lessons: [
      {
        id: '3',
        titleTh: 'บทที่ 1: การสนทนาในร้านอาหาร',
        titleEn: 'Chapter 1: Restaurant Conversations',
        homework: {
          title: 'แบบฝึกหัดการสั่งอาหาร',
          description: 'เขียนบทสนทนาการสั่งอาหารในร้านอาหาร',
          dueDate: '2024-02-15',
          points: 200,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          submissionType: 'text',
          allowedFileTypes: ['txt', 'doc', 'docx'],
          maxFileSize: 5,
          gradingType: 'manual',
          correctAnswer: ''
        }
      }
    ],
    book: null
  },
] as const;
