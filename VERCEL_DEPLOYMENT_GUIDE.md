# คู่มือการ Deploy โปรเจคบน Vercel

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### 1. **Database (PostgreSQL)**
- ใช้ Supabase หรือ Neon (แนะนำสำหรับ production)
- หรือใช้ PostgreSQL hosting อื่นๆ

### 2. **Environment Variables**
สร้างไฟล์ `.env.local` ในโฟลเดอร์หลัก:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (สำหรับรีเซ็ตรหัสผ่าน)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
```

## 🚀 ขั้นตอนการ Deploy บน Vercel

### ขั้นตอนที่ 1: เตรียมโปรเจค
```bash
# 1. Build โปรเจคเพื่อทดสอบ
npm run build

# 2. ตรวจสอบว่าไม่มี error
npm run lint
```

### ขั้นตอนที่ 2: Deploy บน Vercel

#### วิธีที่ 1: ใช้ Vercel CLI (แนะนำ)
```bash
# 1. ติดตั้ง Vercel CLI
npm i -g vercel

# 2. Login เข้า Vercel
vercel login

# 3. Deploy โปรเจค
vercel

# 4. ตอบคำถามตามนี้:
# - Set up and deploy? → Yes
# - Which scope? → เลือก account ของคุณ
# - Link to existing project? → No
# - What's your project's name? → football-booking-v2
# - In which directory is your code located? → ./
# - Want to override the settings? → No
```

#### วิธีที่ 2: ใช้ Vercel Dashboard
1. ไปที่ [vercel.com](https://vercel.com)
2. Login เข้าระบบ
3. คลิก "New Project"
4. Import จาก GitHub/GitLab/Bitbucket
5. เลือก repository ของโปรเจค
6. ตั้งค่า Environment Variables
7. คลิก "Deploy"

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

ใน Vercel Dashboard:
1. ไปที่ Project Settings
2. เลือก "Environment Variables"
3. เพิ่มตัวแปรต่อไปนี้:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `your-secret-key` | Production, Preview, Development |
| `EMAIL_USER` | `your-email@gmail.com` | Production, Preview, Development |
| `EMAIL_PASS` | `your-gmail-app-password` | Production, Preview, Development |

### ขั้นตอนที่ 4: ตั้งค่า Database

#### สำหรับ Supabase:
1. สร้าง project ใหม่ใน Supabase
2. ไปที่ Settings > Database
3. Copy connection string
4. แทนที่ `DATABASE_URL` ใน Vercel

#### สำหรับ Neon:
1. สร้าง project ใหม่ใน Neon
2. Copy connection string
3. แทนที่ `DATABASE_URL` ใน Vercel

### ขั้นตอนที่ 5: รัน Database Migration

```bash
# 1. ตั้งค่า DATABASE_URL ใน Vercel
# 2. รัน migration ใน Vercel Functions

# หรือใช้ Prisma Studio ใน local:
npx prisma studio
```

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

#### 1. **Build Error**
```bash
# ตรวจสอบ build ใน local
npm run build

# แก้ไข TypeScript errors
npm run lint
```

#### 2. **Database Connection Error**
- ตรวจสอบ `DATABASE_URL` ใน Vercel
- ตรวจสอบว่า database อนุญาต external connections
- ตรวจสอบ firewall settings

#### 3. **Environment Variables ไม่ทำงาน**
- ตรวจสอบว่า set ใน Vercel แล้ว
- ตรวจสอบ Environment (Production/Preview/Development)
- Redeploy หลังจากเปลี่ยน environment variables

#### 4. **Prisma Error**
```bash
# เพิ่มใน next.config.ts
experimental: {
  serverComponentsExternalPackages: ['bcrypt', 'bcryptjs']
}
```

## 📱 การทดสอบหลัง Deploy

1. **ทดสอบหน้าแรก**: เปิด URL ของ Vercel
2. **ทดสอบการลงทะเบียน**: สมัครสมาชิกใหม่
3. **ทดสอบการล็อกอิน**: เข้าสู่ระบบ
4. **ทดสอบการรีเซ็ตรหัสผ่าน**: ใช้ฟีเจอร์ลืมรหัสผ่าน
5. **ทดสอบการจองสนาม**: จองสนามบอล

## 🔒 Security Considerations

1. **Environment Variables**: อย่า commit `.env` files
2. **Database**: ใช้ connection pooling สำหรับ production
3. **Authentication**: ใช้ strong secret สำหรับ NextAuth
4. **Email**: ใช้ Gmail App Password ไม่ใช่รหัสผ่านหลัก

## 📊 Monitoring

1. **Vercel Analytics**: เปิดใช้งานใน project settings
2. **Error Tracking**: ตรวจสอบ Function Logs ใน Vercel
3. **Performance**: ใช้ Vercel Speed Insights

## 🚀 Production Checklist

- [ ] Environment variables ถูกต้อง
- [ ] Database connection ทำงาน
- [ ] Authentication ทำงาน
- [ ] Email service ทำงาน
- [ ] All features ทำงานปกติ
- [ ] Performance ดี
- [ ] Error handling ครบถ้วน

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ Vercel Function Logs
2. ตรวจสอบ Build Logs
3. ใช้ Vercel Support หรือ Community
4. ตรวจสอบ GitHub Issues ของ dependencies

---

**หมายเหตุ**: หลังจาก deploy สำเร็จ อย่าลืมอัปเดต `NEXTAUTH_URL` ใน environment variables ให้ตรงกับ domain ของ Vercel


