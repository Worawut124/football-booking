# สรุปการเปลี่ยนแปลงจาก Supabase ไป PostgreSQL + Local Storage

## ไฟล์ที่ถูกแก้ไข

### 1. ไฟล์ที่ถูกแก้ไข/สร้างใหม่
- `src/lib/supabaseStorage.ts` - แก้ไขเป็น Local file storage functions
- `src/lib/supabaseClient.ts` - แก้ไขเป็น PostgreSQL client
- `src/lib/fileStorage.ts` - ไฟล์ใหม่สำหรับ local file storage
- `scripts/create-supabase-buckets.js` - แก้ไขเป็น local directory creation
- `scripts/migrate-to-supabase.js` - แก้ไขเป็น local storage migration
- `package.json` - อัพเดท scripts

### 2. ไฟล์ API Routes ที่แก้ไข

#### `src/app/api/announcements/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `announcements`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `writeFile`, `unlink`, `join`, `existsSync`, `mkdirSync`
  - เพิ่ม import: `uploadFile`, `deleteFile` จาก `@/lib/supabaseStorage`
  - เปลี่ยนการอัพโหลดไฟล์จาก local storage เป็น Supabase storage
  - เปลี่ยนการลบไฟล์จาก local storage เป็น Supabase storage

#### `src/app/api/competition-list/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `competitions`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `path`, `fs`
  - เพิ่ม import: `uploadFile`, `deleteFile`
  - เปลี่ยนการจัดการไฟล์รูปภาพการแข่งขัน

#### `src/app/api/products/route.ts`
- **เปลี่ยนจาก**: เก็บรูปภาพเป็น base64 ในฐานข้อมูล
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `products`
- **การเปลี่ยนแปลง**:
  - ลบ import: `Buffer`
  - เพิ่ม import: `uploadFile`, `deleteFile`
  - เปลี่ยนจาก base64 เป็น URL ของ Supabase

#### `src/app/api/competition-management/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `competition-registrations`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `path`, `fs`
  - เพิ่ม import: `uploadFile`, `deleteFile`
  - เปลี่ยนการจัดการไฟล์หลักฐานการสมัคร

#### `src/app/api/football-competition/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `competition-registrations`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `path`, `fs`
  - เพิ่ม import: `uploadFile`, `deleteFile`
  - เปลี่ยนการจัดการไฟล์หลักฐานการสมัคร

#### `src/app/api/payment-config/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `payment-config`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `fs`, `path`
  - เพิ่ม import: `uploadFile`, `deleteFile`
  - เปลี่ยนการจัดการ QR Code

#### `src/app/api/payments/route.ts`
- **เปลี่ยนจาก**: เก็บไฟล์ใน `public/uploads/`
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `payments`
- **การเปลี่ยนแปลง**:
  - ลบ imports: `writeFile`, `join`
  - เพิ่ม import: `uploadFile`
  - เปลี่ยนการจัดการหลักฐานการชำระเงิน

#### `src/app/api/orders/route.ts`
- **เปลี่ยนจาก**: เก็บรูปภาพเป็น base64 ในฐานข้อมูล
- **เปลี่ยนเป็น**: อัพโหลดไปยัง Supabase bucket `orders`
- **การเปลี่ยนแปลง**:
  - เพิ่ม import: `uploadFile`
  - เปลี่ยนจาก base64 เป็น URL ของ Supabase

### 3. ไฟล์ package.json
- เพิ่ม script: `"migrate-to-supabase": "node scripts/migrate-to-supabase.js"`

## Buckets ที่ต้องสร้างใน Supabase

1. **announcements** - สำหรับรูปภาพข่าวสาร
2. **competitions** - สำหรับรูปภาพการแข่งขัน
3. **products** - สำหรับรูปภาพสินค้า
4. **competition-registrations** - สำหรับไฟล์หลักฐานการสมัคร
5. **payment-config** - สำหรับ QR Code การชำระเงิน
6. **payments** - สำหรับหลักฐานการชำระเงิน
7. **orders** - สำหรับหลักฐานการสั่งซื้อ

## การเปลี่ยนแปลงในฐานข้อมูล

### ข้อมูลที่เปลี่ยนจาก local path เป็น Supabase URL
- `announcement.image`: `/uploads/filename.jpg` → `https://supabase-url/storage/v1/object/public/announcements/images/filename.jpg`
- `competition.imageName`: `filename.jpg` → `https://supabase-url/storage/v1/object/public/competitions/images/filename.jpg`
- `product.imageData`: `base64_string` → `https://supabase-url/storage/v1/object/public/products/images/filename.jpg`
- `competitionRegistration.depositFileName`: `filename.pdf` → `https://supabase-url/storage/v1/object/public/competition-registrations/deposits/filename.pdf`
- `paymentConfig.qrCode`: `/uploads/qrcode.png` → `https://supabase-url/storage/v1/object/public/payment-config/images/qrcode.png`
- `payment.proof`: `/uploads/proof.jpg` → `https://supabase-url/storage/v1/object/public/payments/proofs/proof.jpg`
- `order.slipImage`: `base64_string` → `https://supabase-url/storage/v1/object/public/orders/slips/filename.jpg`

## ขั้นตอนการ Deploy

### 1. ตั้งค่า Supabase
1. สร้าง Supabase project
2. สร้าง buckets ทั้ง 7 ตามที่ระบุ
3. ตั้งค่า policies สำหรับแต่ละ bucket
4. เพิ่ม environment variables

### 2. Deploy โค้ด
1. Deploy โค้ดที่แก้ไขแล้ว
2. รัน migration script: `npm run migrate-to-supabase`
3. ตรวจสอบว่าไฟล์เก่าถูก migrate เรียบร้อย

### 3. ทดสอบ
1. ทดสอบการอัพโหลดรูปภาพใหม่
2. ทดสอบการแสดงรูปภาพ
3. ทดสอบการลบรูปภาพ

## ข้อดีของการเปลี่ยนไปใช้ Supabase Storage

1. **Scalability**: รองรับการใช้งานที่เพิ่มขึ้น
2. **Reliability**: ไฟล์ไม่หายเมื่อ server restart
3. **Performance**: CDN ของ Supabase ช่วยให้โหลดรูปภาพเร็วขึ้น
4. **Cost**: ประหยัดกว่าเมื่อเทียบกับ server storage
5. **Security**: มีระบบ security policies ที่ดีกว่า
6. **Backup**: ไฟล์ถูก backup อัตโนมัติ

## ข้อควรระวัง

1. **Environment Variables**: ต้องตั้งค่าให้ถูกต้อง
2. **Bucket Policies**: ต้องตั้งค่าให้เหมาะสมกับความต้องการ
3. **File Size Limits**: Supabase มี limit ขนาดไฟล์
4. **Migration**: ต้องรัน migration script อย่างระมัดระวัง
5. **Testing**: ต้องทดสอบทุกฟีเจอร์หลัง migration

## การ Rollback (ถ้าจำเป็น)

หากต้องการ rollback กลับไปใช้ local storage:
1. เปลี่ยนโค้ดกลับไปใช้ local storage
2. ดาวน์โหลดไฟล์จาก Supabase กลับมา
3. เก็บไฟล์ใน `public/uploads/`
4. อัพเดทฐานข้อมูลกลับไปใช้ local path
