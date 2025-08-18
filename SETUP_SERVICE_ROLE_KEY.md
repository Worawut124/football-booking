# การตั้งค่า Supabase Service Role Key

เพื่อแก้ไขปัญหา Row Level Security (RLS) ที่ป้องกันการอัพโหลดไฟล์ ให้ตั้งค่า service role key

## ขั้นตอนการตั้งค่า

### 1. หา Service Role Key ใน Supabase Dashboard

1. ไปที่ [supabase.com](https://supabase.com)
2. เข้าสู่ระบบและเลือก project ของคุณ
3. ไปที่ **Settings** > **API** ในเมนูด้านซ้าย
4. คัดลอก **service_role** key (ไม่ใช่ anon key)

### 2. เพิ่ม Service Role Key ในไฟล์ .env

เพิ่มบรรทัดต่อไปนี้ในไฟล์ `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**ตัวอย่าง**:
```env
NEXT_PUBLIC_SUPABASE_URL="https://ebakmjdilyjydtmggdvi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # เพิ่มบรรทัดนี้
```

### 3. รัน Migration อีกครั้ง

หลังจากตั้งค่า service role key แล้ว ให้รันคำสั่ง:

```bash
npm run migrate-to-supabase
```

## หมายเหตุสำคัญ

⚠️ **คำเตือน**: Service role key มีสิทธิ์สูงมาก อย่าเปิดเผยหรือ commit ลง git repository

- ใช้เฉพาะสำหรับ migration script เท่านั้น
- อย่าใช้ใน frontend code
- เก็บไว้เป็นความลับ

## หากยังมีปัญหา

หากยังมีปัญหา ให้ลองวิธีต่อไปนี้:

1. **ตรวจสอบ RLS Policies**: ไปที่ Storage > Policies ใน Supabase Dashboard
2. **ปิด RLS ชั่วคราว**: สำหรับ bucket ที่ต้องการ migrate
3. **สร้าง Public Policies**: สร้าง policy ที่อนุญาตให้ทุกคนอัพโหลดได้

### ตัวอย่าง Public Policy สำหรับ Storage

```sql
-- อนุญาตให้ทุกคนอัพโหลดไฟล์ได้
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bucket_name');

-- อนุญาตให้ทุกคนอ่านไฟล์ได้
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'bucket_name');
```

