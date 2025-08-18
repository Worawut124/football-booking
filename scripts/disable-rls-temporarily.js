require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

// สร้าง Supabase client ด้วย service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// รายชื่อ buckets ที่ต้องปิด RLS
const buckets = [
  'announcements',
  'competitions', 
  'products',
  'competition-registrations',
  'payment-config',
  'payments',
  'orders'
];

async function disableRLS() {
  console.log('กำลังปิด RLS สำหรับ buckets...');
  
  for (const bucketName of buckets) {
    try {
      console.log(`กำลังปิด RLS สำหรับ bucket: ${bucketName}`);
      
      // ปิด RLS สำหรับ bucket
      const { error } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'],
        fileSizeLimit: 52428800
      });

      if (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการปิด RLS สำหรับ "${bucketName}":`, error.message);
      } else {
        console.log(`✅ ปิด RLS สำหรับ "${bucketName}" สำเร็จ`);
      }
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการปิด RLS สำหรับ "${bucketName}":`, error.message);
    }
  }
  
  console.log('\nเสร็จสิ้นการปิด RLS!');
  console.log('\nหมายเหตุ: หลังจาก migration เสร็จแล้ว ให้เปิด RLS กลับมาเพื่อความปลอดภัย');
}

// รันฟังก์ชัน
disableRLS().catch(console.error);
