# การตั้งค่าอีเมลสำหรับการรีเซ็ตรหัสผ่าน

## 1. สร้างไฟล์ .env ในโฟลเดอร์หลักของโปรเจค

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Email Configuration (for password reset)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

## 2. การตั้งค่า Gmail App Password

### สำหรับ Gmail:
1. เปิดการยืนยันตัวตนแบบ 2 ขั้นตอนในบัญชี Google
2. ไปที่ [Google Account Settings](https://myaccount.google.com/)
3. เลือก "Security" > "2-Step Verification"
4. เลือก "App passwords"
5. สร้าง app password สำหรับแอปพลิเคชัน
6. ใช้ app password นี้เป็นค่า `EMAIL_PASS` ในไฟล์ .env

### ตัวอย่างการตั้งค่า:
```env
EMAIL_USER="yourname@gmail.com"
EMAIL_PASS="abcd efgh ijkl mnop"  # App password จาก Google
```

## 3. การทดสอบระบบ

1. รันโปรเจค: `npm run dev`
2. ไปที่หน้า login
3. คลิก "ลืมรหัสผ่าน?"
4. กรอกอีเมลที่ลงทะเบียนในระบบ
5. ตรวจสอบกล่องจดหมายสำหรับอีเมลรีเซ็ตรหัสผ่าน
6. คลิกลิงก์ในอีเมลเพื่อไปยังหน้าตั้งรหัสผ่านใหม่

## 4. หมายเหตุสำคัญ

- App password จะแสดงเพียงครั้งเดียว เก็บไว้อย่างปลอดภัย
- อย่าใช้รหัสผ่านหลักของ Gmail เป็น `EMAIL_PASS`
- ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านที่หมดอายุใน 1 ชั่วโมง
- ตรวจสอบให้แน่ใจว่า `NEXTAUTH_URL` ถูกต้องสำหรับ production

## 5. การแก้ไขปัญหา

### หากไม่สามารถส่งอีเมลได้:
1. ตรวจสอบ EMAIL_USER และ EMAIL_PASS ในไฟล์ .env
2. ตรวจสอบว่า Gmail App Password ถูกต้อง
3. ตรวจสอบการตั้งค่า 2-Step Verification
4. ดู error logs ใน console ของ browser



