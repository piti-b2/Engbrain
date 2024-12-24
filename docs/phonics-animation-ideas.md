# แนวคิดการทำ Animation รูปปากพร้อมเสียง

## วิธีที่ 1: ใช้รูปปากที่มีอยู่แล้ว + ไฟไลท์

### ข้อดี
- ไม่ต้องเพิ่ม UI ใหม่
- ผู้ใช้เห็นการเปลี่ยนแปลงในที่เดิม
- ใช้พื้นที่น้อย

### ข้อเสีย
- อาจสังเกตการเปลี่ยนแปลงได้ยาก
- ไม่สามารถแสดงข้อมูลเพิ่มเติมได้มาก

### โค้ดตัวอย่าง
```typescript
// ในส่วนที่แสดงรูปปากปัจจุบัน
{result.phonics && (
  <div className="flex gap-4 mt-4 mb-4">
    {result.phonics.split('-').map((letter, index) => {
      const mouthShapeUrl = getMouthShapeUrl(`${letter.toLowerCase()}.png`);
      return (
        <div key={index} className="text-center">
          <div 
            className={`w-[80px] h-[80px] relative transition-all duration-300 ${
              currentLetter === letter ? 'ring-4 ring-blue-400 scale-110' : ''
            }`}
            onClick={() => playSequentialAnimation(result.word)}
          >
            <Image
              src={mouthShapeUrl}
              alt={`Mouth position for ${letter}`}
              fill
              className="object-contain"
            />
          </div>
          <p className={`text-sm mt-1 ${
            currentLetter === letter ? 'font-bold text-blue-600' : 'text-gray-600'
          }`}>
            {letter}
          </p>
        </div>
      );
    })}
  </div>
)}
```

## วิธีที่ 2: สร้างหน้าต่างลอย (Modal)

### ข้อดี
- แสดงรูปปากขนาดใหญ่ได้
- มีพื้นที่สำหรับแสดงข้อมูลเพิ่มเติม
- ดึงดูดความสนใจได้ดี
- สามารถเพิ่มคอนโทรลเพิ่มเติมได้

### ข้อเสีย
- ต้องเพิ่ม UI ใหม่
- บังเนื้อหาด้านหลัง
- อาจรบกวนการใช้งานถ้าไม่ต้องการดู animation

### โค้ดตัวอย่าง
```typescript
// Modal Component
const PhonicsAnimationModal = ({ word, isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      bg-white rounded-lg p-6 w-[400px]">
        <h3 className="text-xl font-bold mb-4">Phonics Animation: {word}</h3>
        
        {/* แสดงรูปปากขนาดใหญ่ตรงกลาง */}
        <div className="w-[200px] h-[200px] mx-auto relative">
          <Image
            src={getMouthShapeUrl(`${currentLetter || word[0]}.png`)}
            alt={`Mouth position`}
            fill
            className="object-contain"
          />
        </div>

        {/* แสดงตัวอักษรทั้งหมดด้านล่าง */}
        <div className="flex justify-center gap-4 mt-4">
          {word.split('').map((letter, index) => (
            <div key={index} className={`text-center p-2 rounded ${
              currentLetter === letter ? 'bg-blue-100' : ''
            }`}>
              <span className="text-2xl">{letter}</span>
              <div className="text-sm text-gray-500">
                {/* แสดง IPA หรือข้อมูลเพิ่มเติม */}
              </div>
            </div>
          ))}
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={playAnimation}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Play
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
```

## ฟังก์ชันการเล่นเสียงตามลำดับ

```typescript
// ฟังก์ชันสำหรับเล่นเสียงและแสดงรูปปากตามลำดับ
const playSequentialAnimation = async (word: string) => {
  const letters = word.toLowerCase().split('');
  let currentIndex = 0;

  // ฟังก์ชันสำหรับเล่นเสียงแต่ละตัวอักษร
  const playLetterSound = (letter: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`https://btcmdvroyqwtucrqmuwl.supabase.co/storage/v1/object/public/engbrainstorage/phonics-sound/${letter}.mp3`);
      
      // เมื่อเล่นเสียงจบให้ resolve promise
      audio.onended = () => {
        resolve();
      };
      
      audio.play();
    });
  };

  // เล่นเสียงและแสดงรูปปากทีละตัวอักษร
  const playAnimation = async () => {
    setIsPlaying(true);
    
    for (const letter of letters) {
      setCurrentLetter(letter);  // อัพเดทรูปปากที่แสดง
      await playLetterSound(letter);  // รอให้เสียงเล่นจบ
      await new Promise(resolve => setTimeout(resolve, 200));  // รอเล็กน้อยระหว่างตัวอักษร
    }
    
    setCurrentLetter(null);  // รีเซ็ตกลับไปรูปปากเริ่มต้น
    setIsPlaying(false);
  };
};
```

## แผนการพัฒนาต่อ

1. เริ่มพัฒนาแบบที่ 1 ก่อน (ใช้รูปปากที่มีอยู่แล้ว + ไฟไลท์)
2. ทดสอบกับคำที่มี 2-3 พยางค์
3. ปรับแต่ง timing ระหว่างเสียง
4. เพิ่มการแสดง IPA และความหมาย
5. พัฒนาต่อยอดเป็นแบบที่ 2 ในอนาคต (Modal) ถ้าต้องการฟีเจอร์เพิ่มเติม
