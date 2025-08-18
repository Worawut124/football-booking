require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

// สร้าง Supabase client ด้วย service role key (ต้องตั้งค่าใน .env)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// รายชื่อ buckets ที่ต้องสร้าง
const buckets = [
  'announcements',
  'competitions', 
  'products',
  'competition-registrations',
  'payment-config',
  'payments',
  'orders'
];

async function createBuckets() {
  console.log('เริ่มสร้าง Supabase buckets...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key');
  
  for (const bucketName of buckets) {
    try {
      console.log(`กำลังสร้าง bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // อนุญาตให้เข้าถึงได้สาธารณะ
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'], // อนุญาตไฟล์รูปภาพ, PDF, และ text
        fileSizeLimit: 52428800 // ขนาดไฟล์สูงสุด 50MB
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket "${bucketName}" มีอยู่แล้ว`);
        } else {
          console.error(`❌ เกิดข้อผิดพลาดในการสร้าง bucket "${bucketName}":`, error.message);
        }
      } else {
        console.log(`✅ สร้าง bucket "${bucketName}" สำเร็จ`);
      }
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการสร้าง bucket "${bucketName}":`, error.message);
    }
  }
  
  console.log('\nเสร็จสิ้นการสร้าง buckets!');
  console.log('\nหมายเหตุ: หากยังมีปัญหา ให้สร้าง buckets ผ่าน Supabase Dashboard แทน');
  console.log('สำหรับข้อมูลเพิ่มเติม ดูที่ไฟล์ SUPABASE_SETUP.md');
}

// รันฟังก์ชัน
createBuckets().catch(console.error);
