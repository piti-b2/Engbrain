'use client';

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/translations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Volume2, BookA } from "lucide-react";
import Image from 'next/image';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@clerk/nextjs";  
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// เพิ่ม interface
interface PhonicsSound {
  ipa_symbol: string;
  phonics_letter: string;
  sound_type: string;
  sound_url?: string;
  us_sound_url?: string;
  uk_sound_url?: string;
}

interface SearchResult {
  word: string;
  phonics: string;
  ipa?: {
    us?: string;
    uk?: string;
  };
  word_group?: string;
  thai_meaning?: string;
  part_of_speech?: string;
  sample_sentence?: string;
  soundUrls?: {
    default?: string;
    us?: string;
    uk?: string;
  };
  isTricky?: boolean;
  pattern?: string;
}

interface PhonicsResult {
  phonics: string;
  thai_meaning?: string;
  part_of_speech?: string;
  sample_sentence?: string;
  word_group?: string;
  pattern?: string;
}

// เพิ่มฟังก์ชัน searchWord
const searchWord = async (term: string) => {
  try {
    const response = await fetch(`/api/search?word=${encodeURIComponent(term)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error searching word:', error);
    throw error; // ส่งต่อ error ไปให้ handleSearch จัดการ
  }
};

// เพิ่มฟังก์ชัน isSightWord
const isSightWord = (wordGroup: string | undefined): boolean => {
  if (!wordGroup) return false;
  return wordGroup.toLowerCase().includes('sight') || wordGroup.toLowerCase() === 'sight words';
};

export default function PhonicsDictionaryPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [currentAccessId, setCurrentAccessId] = useState<number | null>(null);
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null);
  const supabase = createClientComponentClient();
  const { userId } = useAuth();  

  // เพิ่มฟังก์ชันตรวจสอบการใช้งานรายวัน
  const checkDailyUsage = async () => {
    if (!currentAccessId) return false;

    try {
      // เรียกใช้ stored procedure แทนการอัพเดตโดยตรง
      const { data, error } = await supabase
        .rpc('update_daily_usage', {
          p_access_id: currentAccessId
        });

      if (error) {
        console.error('Error checking daily usage:', error);
        return false;
      }

      console.log('Daily usage check result:', data);

      return data.success;
    } catch (error) {
      console.error('Error in checkDailyUsage:', error);
      return false;
    }
  };

  // เพิ่มฟังก์ชันดึงจำนวนครั้งที่เหลือ
  const fetchRemainingUsage = async () => {
    if (!currentAccessId) return;

    try {
      const { data: access, error } = await supabase
        .from('course_access')
        .select('daily_limit, usage_count, is_free')
        .eq('id', currentAccessId)
        .single();

      if (error) {
        console.error('Error fetching remaining usage:', error);
        return;
      }

      if (access && access.is_free) {
        const remaining = access.daily_limit - (access.usage_count || 0);
        setRemainingUsage(Math.max(0, remaining));
      } else {
        setRemainingUsage(null);
      }
    } catch (error) {
      console.error('Error in fetchRemainingUsage:', error);
    }
  };

  // ตรวจสอบสิทธิ์เมื่อโหลดหน้า
  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('Checking access with userId:', userId);

        if (!userId) {
          console.log('No Clerk user found');
          return;
        }

        // ดึง user id จากตาราง User
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('id')
          .eq('clerkId', userId)  
          .single();

        console.log('User query result:', { userData, userError });

        if (userError || !userData) {
          console.error('Error getting user:', userError);
          console.log('User data from DB:', userData);
          return;
        }

        // ตรวจสอบสิทธิ์การเข้าถึง
        const { data: access, error: accessError } = await supabase
          .from('course_access')
          .select('*')
          .eq('user_id', userData.id)
          .eq('course_id', 'course_004')
          .eq('status', 'ACTIVE')
          .order('expiry_date', { ascending: false })
          .limit(1);

        console.log('Access check result:', {
          access,
          accessError,
          userId: userData.id,
          courseId: 'course_004'
        });

        if (accessError) {
          console.error('Error checking access:', accessError);
          return;
        }

        if (!access || access.length === 0) {
          console.log('No active access found');
          console.log('Access data:', access);
          return;
        }

        const validAccess = access[0];
        const expiryDate = new Date(validAccess.expiry_date);
        const now = new Date();

        console.log('Access details:', {
          validAccess,
          expiryDate,
          now,
          isValid: expiryDate > now,
          timeDiff: expiryDate.getTime() - now.getTime()
        });

        if (expiryDate <= now) {
          console.log('Access expired');
          return;
        }

        console.log('Access granted:', validAccess);
        setHasAccess(true);
        setCurrentAccessId(validAccess.id);
      } catch (error) {
        console.error('Error in checkAccess:', error);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    if (userId) {  
      checkAccess();
    }
  }, [userId]);  

  // เรียกใช้ตอนโหลดหน้าและหลังการค้นหา
  useEffect(() => {
    if (hasAccess) {
      fetchRemainingUsage();
    }
  }, [hasAccess, currentAccessId]);

  // แสดง loading ขณะตรวจสอบสิทธิ์
  if (isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ถ้าไม่มีสิทธิ์ แสดงข้อความแทนการ redirect
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
        </h1>
        <p className="text-gray-600 text-center mb-4">
          {language === 'th' 
            ? 'คุณไม่มีสิทธิ์เข้าถึงเครื่องมือนี้ กรุณาซื้อแพ็คเกจก่อนใช้งาน'
            : 'You do not have access to this tool. Please purchase a package to continue.'}
        </p>
        <Button
          onClick={() => window.location.href = '/dashboard/tools'}
          className="bg-blue-500 text-white"
        >
          {language === 'th' ? 'กลับไปหน้าเครื่องมือ' : 'Back to Tools'}
        </Button>
      </div>
    );
  }

  // ฐานข้อมูลรูปปากสำหรับเสียงต่างๆ จาก Supabase Storage
  const BUCKET_NAME = 'engbrainstorage';

  const getMouthShapeUrl = (filename: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/mouth-shapes/${filename}`;
  };

  const mouthShapes: { [key: string]: string } = {
    // เสียงสระ
'a': getMouthShapeUrl('a.png'),  //แอะ
's': getMouthShapeUrl('s.png'),  //ซึ
't': getMouthShapeUrl('t.png'),  //ถึ
'p': getMouthShapeUrl('p.png'),  //เพอะ
'i': getMouthShapeUrl('i.png'),  //อิ
'n': getMouthShapeUrl('n.png'),  //อึน
'e': getMouthShapeUrl('e.png'),  //เอะ
'k': getMouthShapeUrl('k.png'),  //เข่อะ
'c': getMouthShapeUrl('c.png'),  //เข่อะ
'r': getMouthShapeUrl('r.png'),  //เหร่อะ/เออร์
'h': getMouthShapeUrl('h.png'),  //เฮอะ
'm': getMouthShapeUrl('m.png'),  //อึม
'd': getMouthShapeUrl('d.png'),  //ดึ
'o': getMouthShapeUrl('o.png'),  //เอาะ
'g': getMouthShapeUrl('g.png'),  //เกอะ
'u': getMouthShapeUrl('u.png'),  //อะ
'l': getMouthShapeUrl('l.png'),  //อึล
'b': getMouthShapeUrl('b.png'),  //เบอะ
'f': getMouthShapeUrl('f.png'),  //ฟึ
'j': getMouthShapeUrl('j.png'),  //เจอะ
'ai': getMouthShapeUrl('ai.png'),  //เอ
'ee': getMouthShapeUrl('ee.png'),  //อี
'ie': getMouthShapeUrl('ie.png'),  //อาย
'oa': getMouthShapeUrl('oa.png'),  //โอ
'or': getMouthShapeUrl('or.png'),  //ออ
'w': getMouthShapeUrl('w.png'),  //เวอะ
'z': getMouthShapeUrl('z.png'),  //ซี(สั่นที่ลำคอ)
'v': getMouthShapeUrl('v.png'),  //ฟิเหวอะ
'ng': getMouthShapeUrl('ng.png'),  //อึง
'nk': getMouthShapeUrl('nk.png'),  //อึงขึ
'oo(short)': getMouthShapeUrl('oo(short).png'),  //อุ(เสียงสั้น)
'oo(long)': getMouthShapeUrl('oo(long).png'),  //อู(เสียงยาว)
'ch': getMouthShapeUrl('ch.png'),  //ฉึ
'sh': getMouthShapeUrl('sh.png'),  //ชู
'y': getMouthShapeUrl('y.png'),  //เหยอะ
'x': getMouthShapeUrl('x.png'),  //ขึซ
'th(voiced)': getMouthShapeUrl('th(voiced).png'),  //ดื่อ(แลบลิ้นสั่นที่ลำคอ)
'th(unvoiced)': getMouthShapeUrl('th(unvoiced).png'),  //ซือ(แลบลิ้นไม่สั่นที่ลำคอ)
'qu': getMouthShapeUrl('qu.png'),  //เขวอะ
'ou': getMouthShapeUrl('ou.png'),  //อาว
'oi': getMouthShapeUrl('oi.png'),  //ออย
'er': getMouthShapeUrl('er.png'),  //เออร์
'ue': getMouthShapeUrl('ue.png'),  //ยู
'ar': getMouthShapeUrl('ar.png'),  //อาร์
'air': getMouthShapeUrl('air.png'),  //แอร์
'ear': getMouthShapeUrl('ear.png'),  //เอียร์


  };

  // ฟังก์ชันแยกคำเป็นเสียง
  const getPhonicsSegments = (word: string): string[] => {
    const segments: string[] = [];
    let i = 0;
    
    while (i < word.length) {
      // ตรวจสอบเสียงควบกล้ำ
      if (i < word.length - 1) {
        const pair = word.slice(i, i + 2);
        if (['ch', 'sh', 'th', 'ph', 'wh'].includes(pair)) {
          segments.push(pair);
          i += 2;
          continue;
        }
      }
      // เพิ่มตัวอักษรเดี่ยว
      segments.push(word[i]);
      i++;
    }
    
    return segments;
  };

  // ฟังก์ชันเล่นเสียงตามสำเนียง
  const speakWithAccent = (text: string, accent: 'UK' | 'US') => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const voice = voices.find(voice => 
      accent === 'UK' ? voice.lang === 'en-GB' : voice.lang === 'en-US'
    );

    if (voice) {
      utterance.voice = voice;
    } else {
      utterance.lang = accent === 'UK' ? 'en-GB' : 'en-US';
    }
    
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // ฟังก์ชันตรวจสอบ tricky words
  const isTrickyWord = (word: string): boolean => {
    const trickyWords = [
      'the', 'to', 'do', 'of', 'was', 'is', 'his', 'has', 'I',
      'you', 'your', 'they', 'be', 'he', 'me', 'she', 'we', 'no',
      'go', 'so', 'my', 'one', 'by', 'only', 'old', 'like', 'have',
      'live', 'give', 'little', 'down', 'what', 'when', 'why', 'where',
      'who', 'which', 'any', 'many', 'more', 'before', 'other', 'were',
      'because', 'want', 'saw', 'put', 'could', 'should', 'would', 'right',
      'two', 'four', 'goes'
    ];
    return trickyWords.includes(word.toLowerCase());
  };

  // ฟังก์ชันหารูปแบบ phonic
  const getPhonicPattern = (word: string): string => {
    // รูปแบบพื้นฐานที่พบบ่อย
    const patterns = [
      { pattern: /[aeiou]{2,}/, name: 'vowel team' },
      { pattern: /(.)\\1/, name: 'double consonant' },
      { pattern: /[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]/, name: 'CVC' },
      { pattern: /^[bcdfghjklmnpqrstvwxyz][bcdfghjklmnpqrstvwxyz]/, name: 'consonant blend' },
      { pattern: /ing$/, name: '-ing' },
      { pattern: /ed$/, name: '-ed' },
      { pattern: /[aeiou][bcdfghjklmnpqrstvwxyz]e$/, name: 'magic e' }
    ];

    for (const { pattern, name } of patterns) {
      if (pattern.test(word.toLowerCase())) {
        return name;
      }
    }

    return 'regular';
  };

  // ฟังก์ชันแปลงคำเป็น EngBrain Phonics
  const getEngBrainPhonics = async (word: string): Promise<{
    results: PhonicsResult[];
    soundUrls?: {
      default?: string;
      us?: string;
      uk?: string;
    };
  }> => {
    const supabase = createClientComponentClient();
    
    try {
      const { data, error } = await supabase
        .from('phonics_words')
        .select('*')
        .eq('word', word.toLowerCase());

      if (error) {
        console.error('Supabase error:', error);
        return { results: [] };
      }

      return {
        results: data || [],
        soundUrls: {
          us: '',
          uk: ''
        }
      };
    } catch (error) {
      console.error('Error in getEngBrainPhonics:', error);
      return { results: [] };
    }
  };

  // ฟังก์ชันดึงข้อมูลคำจาก Dictionary APIs
  const fetchWordDetails = async (word: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClientComponentClient();
      
      // ค้นหาข้อมูลจาก phonics_words แบบเงียบๆ ไม่แสดง error
      const { data: phonicsData } = await supabase
        .from('phonics_words')
        .select('*')
        .eq('word', word.toLowerCase())
        .maybeSingle();

      // ถ้าพบข้อมูลใน Supabase ให้ใช้ข้อมูลนั้น
      if (phonicsData) {
        return {
          word: phonicsData.word,
          phonics: phonicsData.phonics,
          ipa: {
            us: phonicsData.ipa_us || '',
            uk: phonicsData.ipa_uk || ''
          },
          word_group: phonicsData.word_group,
          thai_meaning: phonicsData.thai_meaning,
          part_of_speech: phonicsData.part_of_speech,
          sample_sentence: phonicsData.sample_sentence,
          soundUrls: {
            us: phonicsData.us_sound_url,
            uk: phonicsData.uk_sound_url
          },
          isTricky: phonicsData.is_tricky,
          pattern: phonicsData.pattern
        };
      }

      // ถ้าไม่พบข้อมูลใน Supabase ให้ลองค้นหาจาก Free Dictionary API
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Free Dictionary API response:', data);
          
          // ดึง IPA และ audio URLs
          const ipa = {
            us: '',
            uk: ''
          };
          const soundUrls = {
            us: '',
            uk: ''
          };

          if (data[0]?.phonetics) {
            console.log('Phonetics data:', data[0].phonetics);
            // รวบรวมข้อมูลจากทุก phonetics entries
            data[0].phonetics.forEach((phonetic: any) => {
              console.log('Processing phonetic:', phonetic);
              if (phonetic.text) {
                const ipaText = phonetic.text.replace(/[\/\[\]]/g, '');
                // ถ้ามี audio ให้ใช้ audio เป็นตัวบ่งชี้ว่าเป็น US หรือ UK
                if (phonetic.audio?.includes('-us.')) {
                  ipa.us = ipaText;
                  soundUrls.us = phonetic.audio;
                } else if (phonetic.audio?.includes('-uk.')) {
                  ipa.uk = ipaText;
                  soundUrls.uk = phonetic.audio;
                } else {
                  // ถ้าไม่มี audio หรือไม่ระบุประเทศ ให้ใช้เป็น default
                  if (!ipa.us) {
                    ipa.us = ipaText;
                  }
                  if (!ipa.uk) {
                    ipa.uk = ipaText;  // ใช้ค่าเดียวกันสำหรับ UK ถ้าไม่มีค่าเฉพาะ
                  }
                }
              }
              // ถ้ามี audio แต่ไม่มี IPA ให้เก็บ URL ไว้
              if (phonetic.audio) {
                if (phonetic.audio.includes('-us.')) {
                  soundUrls.us = phonetic.audio;
                } else if (phonetic.audio.includes('-uk.')) {
                  soundUrls.uk = phonetic.audio;
                }
              }
            });
            console.log('Final IPA values:', ipa);
            console.log('Final sound URLs:', soundUrls);
          }
          const meanings = data[0]?.meanings || [];
          let partOfSpeech = '';
          let definition = '';
          let example = '';

          // ดึงข้อมูลจาก meaning แรกที่มี
          if (meanings.length > 0) {
            partOfSpeech = meanings[0].partOfSpeech || '';
            if (meanings[0].definitions && meanings[0].definitions.length > 0) {
              definition = meanings[0].definitions[0].definition || '';
              example = meanings[0].definitions[0].example || '';
            }
          }

          return {
            word: word,
            phonics: '',  // Free Dictionary API doesn't provide EngBrain Phonics
            ipa: ipa,
            word_group: 'regular',
            thai_meaning: definition, // ใช้ความหมายภาษาอังกฤษไปก่อน
            part_of_speech: partOfSpeech,
            sample_sentence: example,
            pattern: 'CVC',  // เพิ่ม pattern
            soundUrls: soundUrls,
            isTricky: false
          };
        }
      } catch (error) {
        // ไม่แสดง error จาก Free Dictionary API ในคอนโซล
      }

      // ถ้าไม่พบข้อมูลจากทั้งสองแหล่ง
      return {
        word: word,
        phonics: '',
        ipa: { us: '', uk: '' },
        soundUrls: {},
        part_of_speech: '',
        thai_meaning: '',
        sample_sentence: '',
        pattern: 'CVC',  // เพิ่ม pattern
        word_group: 'regular',
        isTricky: false
      };

    } catch (error: any) {
      // จัดการ error ทั่วไปแบบเงียบๆ
      return {
        word: word,
        phonics: '',
        ipa: { us: '', uk: '' },
        soundUrls: {},
        part_of_speech: '',
        thai_meaning: '',
        sample_sentence: '',
        pattern: 'CVC',  // เพิ่ม pattern
        word_group: 'regular',
        isTricky: false
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันเรียก API สำรอง
  const getWordDataFromBackupAPI = async (word: string) => {
    try {
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word}`, {
        headers: {
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error('Backup API request failed');
      }

      const data = await response.json();
      
      // แปลงข้อมูลให้อยู่ในรูปแบบเดียวกับ Free Dictionary API
      return {
        word: data.word,
        phonetic: data.pronunciation?.all || '',
        meanings: data.results.map((result: any) => ({
          partOfSpeech: result.partOfSpeech,
          definitions: [{
            definition: result.definition,
            example: result.examples?.[0] || ''
          }]
        }))
      };
    } catch (error) {
      console.error('Error fetching from backup API:', error);
      return null;
    }
  };

  // ฟังก์ชันค้นหาคำศัพท์
  const handleSearch = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    if (!searchTerm?.trim()) {
      toast({
        title: language === 'th' ? 'กรุณากรอกคำที่ต้องการค้นหา' : 'Please enter a word to search',
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // ตรวจสอบสิทธิ์การใช้งาน
      const { data: accessData, error: accessError } = await supabase
        .from('course_access')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', 'phonics-dictionary')
        .single();

      if (accessError) {
        console.error('Error checking access:', accessError);
        setError(language === 'th' 
          ? 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์การใช้งาน' 
          : 'Error checking access permissions');
        return;
      }

      if (!accessData) {
        setError(language === 'th'
          ? 'คุณไม่มีสิทธิ์ใช้งานพจนานุกรมโฟนิกส์ กรุณาซื้อแพ็คเกจเพื่อใช้งาน'
          : 'You don\'t have access to Phonics Dictionary. Please purchase a package.');
        return;
      }

      // ตรวจสอบจำนวนครั้งที่ใช้งานต่อวัน
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData, error: usageError } = await supabase
        .from('feature_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('feature', 'phonics-dictionary')
        .eq('date', today)
        .single();

      const currentUsage = usageData?.count || 0;
      
      if (currentUsage >= accessData.daily_limit) {
        setError(language === 'th'
          ? 'คุณใช้งานครบจำนวนครั้งต่อวันแล้ว กรุณารอถึงวันพรุ่งนี้หรืออัพเกรดแพ็คเกจ'
          : 'Daily usage limit reached. Please wait until tomorrow or upgrade your package.');
        return;
      }

      // ดึงข้อมูลจาก API
      const phonicsData = await getEngBrainPhonics(searchTerm);
      
      if (!phonicsData.results || phonicsData.results.length === 0) {
        setError(language === 'th'
          ? 'ไม่พบข้อมูลสำหรับคำที่ค้นหา'
          : 'No results found for the searched word');
        return;
      }

      // อัพเดทจำนวนการใช้งาน
      const { error: updateError } = await supabase
        .from('feature_usage')
        .upsert([
          {
            user_id: userId,
            feature: 'phonics-dictionary',
            date: today,
            count: currentUsage + 1
          }
        ]);

      if (updateError) {
        console.error('Error updating usage:', updateError);
      }

      // อัพเดท remaining usage
      setRemainingUsage(accessData.daily_limit - (currentUsage + 1));

      // แปลงผลลัพธ์และแสดงผล
      const results = await Promise.all(
        phonicsData.results.map(async (data: PhonicsResult) => {
          const result = {
            word: searchTerm,
            phonics: data.phonics || '',
            ipa: { us: '', uk: '' },
            soundUrls: phonicsData.soundUrls || { us: '', uk: '' },
            isTricky: false,
            pattern: data.pattern || analyzeWordPattern(searchTerm),
            thai_meaning: data.thai_meaning || '',
            part_of_speech: data.part_of_speech || '',
            sample_sentence: data.sample_sentence || '',
            word_group: data.word_group || ''
          };
          return result;
        })
      );

      setSearchResults(results);

    } catch (error) {
      console.error('Search error:', error);
      setError(language === 'th'
        ? 'เกิดข้อผิดพลาดในการค้นหา'
        : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันเล่นเสียง
  const playPhonicsSound = (sound: string) => {
    const audio = new Audio(`https://btcmdvroyqwtucrqmuwl.supabase.co/storage/v1/object/public/engbrainstorage/phonics-sound/${sound}.mp3`);
    audio.play();
  };

  // ฟังก์ชันวิเคราะห์รูปแบบคำ
  const analyzeWordPattern = (word: string): string => {
    // คำที่มี magic e
    if (/[aeiou][^aeiou]e$/i.test(word)) {
      return 'Magic E';
    }
    
    // คำที่มีสระคู่
    if (/[aeiou]{2}/i.test(word)) {
      return 'Vowel Team';
    }
    
    // คำที่มีรูปแบบ CVC
    if (/^[^aeiou][aeiou][^aeiou]$/i.test(word)) {
      return 'CVC';
    }
    
    // คำที่มีรูปแบบ CCVC
    if (/^[^aeiou]{2}[aeiou][^aeiou]$/i.test(word)) {
      return 'CCVC';
    }
    
    // คำที่มีรูปแบบ CVCC
    if (/^[^aeiou][aeiou][^aeiou]{2}$/i.test(word)) {
      return 'CVCC';
    }
    
    return 'Other';
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">พจนานุกรมโฟนิกส์</h1>
      
      {/* ช่องค้นหา */}
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder={language === 'th' ? 'พิมพ์คำศัพท์ที่ต้องการค้นหา...' : 'Type a word to search...'}
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
        />
        <Button onClick={(e) => handleSearch(e)} disabled={isLoading}>
          <Search className="w-4 h-4 mr-2" />
          {language === 'th' ? 'ค้นหา' : 'Search'}
        </Button>
        {remainingUsage !== null && (
          <p className="text-sm text-gray-600 mt-2">
            {language === 'th' 
              ? `เหลือการค้นหา ${remainingUsage} ครั้งในวันนี้`
              : `${remainingUsage} searches remaining today`}
          </p>
        )}
      </div>

      {/* แสดงข้อผิดพลาด */}
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* แสดงผลการค้นหา */}
      <div className="space-y-6">
        {searchResults.map((result, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {result.word}
                  </h3>
                  {/* ปุ่มเล่นเสียง */}
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => speakWithAccent(result.word, 'US')}
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      US 🇺🇸
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => speakWithAccent(result.word, 'UK')}
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      UK 🇬🇧
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* แสดง IPA */}
                  {result.ipa && (
                    <div className="space-y-2">
                      {result.ipa.us && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">IPA (US):</span>
                          <p className="text-gray-600">{result.ipa.us}</p>
                        </div>
                      )}
                      {result.ipa.uk && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">IPA (UK):</span>
                          <p className="text-gray-600">{result.ipa.uk}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* แสดง Sight Word Warning หรือ EngBrain Phonics */}
                  {isSightWord(result.word_group) ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <BookA className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            คำนี้เป็น Sight Word ควรจำรูปคำทั้งคำ ไม่ต้องแยกเสียง
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* แสดง EngBrain Phonics สำหรับคำปกติ */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">EngBrain Phonics:</span>
                          <p className="text-gray-600">{result.phonics || '-'}</p>
                        </div>
                      </div>

                      {/* แสดงรูปปากสำหรับแต่ละเสียง */}
                      {result.phonics && (
                        <div className="flex gap-4 mt-4 mb-4">
                          {result.phonics.split('-').map((letter: string, index: number) => {
                            const mouthShapeUrl = getMouthShapeUrl(`${letter.toLowerCase()}.png`);
                            return (
                              <div key={index} className="text-center">
                                <div 
                                  className="w-[80px] h-[80px] relative cursor-pointer"
                                  onClick={() => playPhonicsSound(letter)}
                                >
                                  <Image
                                    src={mouthShapeUrl}
                                    alt={`Mouth position for ${letter}`}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{letter}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* แสดงประเภทคำ */}
                      <div className="flex gap-2 text-sm mt-4">
                        <span className={`px-2 py-1 rounded ${
                          result.isTricky 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {result.isTricky ? 'Tricky Word' : result.pattern}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          result.isTricky
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {result.isTricky ? 'irregular' : 'regular'}
                        </span>
                      </div>

                      {/* แสดงข้อมูลเพิ่มเติม */}
                      <div className="mt-4 space-y-2">
                        {result.word_group && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              Group: {result.word_group}
                            </span>
                          </div>
                        )}

                        {result.thai_meaning && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              ความหมาย: {result.thai_meaning}
                            </span>
                          </div>
                        )}

                        {result.part_of_speech && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              Part of Speech: {result.part_of_speech}
                            </span>
                          </div>
                        )}

                        {result.sample_sentence && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              Sample: {result.sample_sentence}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Toaster />
    </div>
  );
}
