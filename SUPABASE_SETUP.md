# การตั้งค่า Supabase Storage สำหรับโปรเจค Football Booking

## 1. การตั้งค่า Supabase Project

### 1.1 สร้าง Supabase Project
1. ไปที่ [supabase.com](https://supabase.com)
2. สร้าง project ใหม่
3. เก็บ URL และ anon key ไว้

### 1.2 ตั้งค่า Environment Variables
เพิ่ม environment variables ในไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. การสร้าง Storage Buckets

### 2.1 สร้าง Buckets ใน Supabase Dashboard
ไปที่ Storage ใน Supabase Dashboard และสร้าง buckets ต่อไปนี้:

1. **announcements** - สำหรับรูปภาพข่าวสาร
2. **competitions** - สำหรับรูปภาพการแข่งขัน
3. **products** - สำหรับรูปภาพสินค้า
4. **competition-registrations** - สำหรับไฟล์หลักฐานการสมัคร
5. **payment-config** - สำหรับ QR Code การชำระเงิน
6. **payments** - สำหรับหลักฐานการชำระเงิน
7. **orders** - สำหรับหลักฐานการสั่งซื้อ

### 2.2 ตั้งค่า Bucket Policies
สำหรับแต่ละ bucket ให้ตั้งค่า policies ดังนี้:

#### Public Read Access (สำหรับรูปภาพที่ต้องการแสดง)
```sql
-- อนุญาตให้อ่านไฟล์ได้
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'bucket_name');
```

#### Authenticated Upload (สำหรับการอัพโหลด)
```sql
-- อนุญาตให้ authenticated users อัพโหลดได้
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bucket_name' AND auth.role() = 'authenticated');
```

#### Owner Update/Delete (สำหรับการแก้ไข/ลบ)
```sql
-- อนุญาตให้ owner แก้ไข/ลบไฟล์ได้
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'bucket_name' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'bucket_name' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 3. โครงสร้างไฟล์ใน Storage

### 3.1 announcements bucket
```
announcements/
└── images/
    ├── 1234567890-image1.jpg
    ├── 1234567891-image2.png
    └── ...
```

### 3.2 competitions bucket
```
competitions/
└── images/
    ├── 1234567890-competition1.jpg
    ├── 1234567891-competition2.png
    └── ...
```

### 3.3 products bucket
```
products/
└── images/
    ├── 1234567890-product1.jpg
    ├── 1234567891-product2.png
    └── ...
```

### 3.4 competition-registrations bucket
```
competition-registrations/
└── deposits/
    ├── 1234567890-deposit1.pdf
    ├── 1234567891-deposit2.jpg
    └── ...
```

### 3.5 payment-config bucket
```
payment-config/
└── images/
    ├── 1234567890-qrcode.png
    └── ...
```

### 3.6 payments bucket
```
payments/
└── proofs/
    ├── 1234567890-proof1.jpg
    ├── 1234567891-proof2.png
    └── ...
```

### 3.7 orders bucket
```
orders/
└── slips/
    ├── 1234567890-slip1.jpg
    ├── 1234567891-slip2.png
    └── ...
```

## 4. การใช้งานในโค้ด

### 4.1 อัพโหลดไฟล์
```typescript
import { uploadFile } from '@/lib/supabaseStorage';

const uploadResult = await uploadFile(file, 'bucket_name', 'folder_name');
if (uploadResult.error) {
  console.error('Upload failed:', uploadResult.error);
} else {
  console.log('Upload success:', uploadResult.url);
}
```

### 4.2 ลบไฟล์
```typescript
import { deleteFile } from '@/lib/supabaseStorage';

const deleteResult = await deleteFile('bucket_name', 'folder_name/filename.ext');
if (deleteResult.success) {
  console.log('File deleted successfully');
} else {
  console.error('Delete failed:', deleteResult.error);
}
```

## 5. การทดสอบ

### 5.1 ทดสอบการอัพโหลด
1. เปิดแอปพลิเคชัน
2. ลองอัพโหลดรูปภาพในส่วนต่างๆ
3. ตรวจสอบว่าไฟล์ถูกอัพโหลดไปยัง Supabase storage
4. ตรวจสอบว่า URL ที่ได้สามารถเข้าถึงได้

### 5.2 ทดสอบการลบ
1. ลบข้อมูลที่มีรูปภาพ
2. ตรวจสอบว่าไฟล์ใน Supabase storage ถูกลบด้วย

## 6. การแก้ไขปัญหา

### 6.1 ไฟล์ไม่สามารถอัพโหลดได้
- ตรวจสอบ environment variables
- ตรวจสอบ bucket policies
- ตรวจสอบขนาดไฟล์ (Supabase มี limit)

### 6.2 ไฟล์ไม่สามารถเข้าถึงได้
- ตรวจสอบ public access policy
- ตรวจสอบ URL ที่ถูกต้อง

### 6.3 ไฟล์ไม่สามารถลบได้
- ตรวจสอบ delete policy
- ตรวจสอบ path ที่ถูกต้อง

## 7. หมายเหตุสำคัญ

1. **ขนาดไฟล์**: Supabase มี limit ขนาดไฟล์ (โดยปกติ 50MB)
2. **File Types**: ตรวจสอบ file types ที่อนุญาต
3. **Security**: ตั้งค่า policies ให้เหมาะสมกับความต้องการ
4. **Backup**: ควรมี backup strategy สำหรับไฟล์สำคัญ
5. **Cost**: ตรวจสอบ pricing ของ Supabase storage
