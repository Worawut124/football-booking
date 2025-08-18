# การสร้าง Supabase Storage Buckets ผ่าน Dashboard

เนื่องจาก Supabase มี Row Level Security (RLS) ที่ป้องกันการสร้าง buckets ผ่าน API ให้สร้าง buckets ผ่าน Dashboard แทน

## ขั้นตอนการสร้าง Buckets

### 1. เข้าสู่ Supabase Dashboard
1. ไปที่ [supabase.com](https://supabase.com)
2. เข้าสู่ระบบและเลือก project ของคุณ
3. ไปที่ **Storage** ในเมนูด้านซ้าย

### 2. สร้าง Buckets ที่จำเป็น

สร้าง buckets ต่อไปนี้ทีละตัว:

#### 2.1 announcements
- **ชื่อ**: `announcements`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*`

#### 2.2 competitions
- **ชื่อ**: `competitions`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*`

#### 2.3 products
- **ชื่อ**: `products`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*`

#### 2.4 competition-registrations
- **ชื่อ**: `competition-registrations`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*, application/pdf`

#### 2.5 payment-config
- **ชื่อ**: `payment-config`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*`

#### 2.6 payments
- **ชื่อ**: `payments`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*, application/pdf`

#### 2.7 orders
- **ชื่อ**: `orders`
- **Public**: ✅ เปิดใช้งาน
- **File size limit**: 50 MB
- **Allowed MIME types**: `image/*, application/pdf`

### 3. ตั้งค่า RLS Policies (ถ้าจำเป็น)

หากต้องการความปลอดภัยเพิ่มเติม สามารถตั้งค่า RLS policies ได้:

1. ไปที่ **Authentication** > **Policies**
2. เลือก bucket ที่ต้องการ
3. สร้าง policies ตามความต้องการ

## หลังจากสร้าง Buckets เสร็จ

เมื่อสร้าง buckets ทั้งหมดเสร็จแล้ว ให้รันคำสั่งต่อไปนี้:

```bash
npm run migrate-to-supabase
```

## หมายเหตุ

- Buckets ทั้งหมดควรตั้งค่าเป็น **Public** เพื่อให้สามารถเข้าถึงไฟล์ได้โดยไม่ต้อง authentication
- หากมีปัญหาในการสร้าง buckets ผ่าน Dashboard ให้ตรวจสอบสิทธิ์การเข้าถึง project ของคุณ

