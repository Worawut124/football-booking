# 🚀 Football Booking V2 - Deploy to Vercel

## ⚡ Quick Deploy

### 1. **เตรียมโปรเจค**
```bash
# Build ทดสอบ
npm run build

# ตรวจสอบ TypeScript
npm run type-check
```

### 2. **Deploy ด้วย Vercel CLI**
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login และ Deploy
vercel login
vercel
```

### 3. **ตั้งค่า Environment Variables ใน Vercel**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## 🗄️ Database Setup

### **Supabase (แนะนำ)**
1. สร้าง project ที่ [supabase.com](https://supabase.com)
2. Copy connection string จาก Settings > Database
3. ใช้เป็น `DATABASE_URL` ใน Vercel

### **Neon**
1. สร้าง project ที่ [neon.tech](https://neon.tech)
2. Copy connection string
3. ใช้เป็น `DATABASE_URL` ใน Vercel

## 🔧 Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Vercel Build**: `npm run vercel-build` (auto-run migrations)
- **Type Check**: `npm run type-check`

## 📁 Files Structure

```
football_booking_v2/
├── vercel.json              # Vercel configuration
├── .vercelignore            # Files to ignore
├── next.config.ts           # Next.js config
├── package.json             # Dependencies & scripts
├── prisma/                  # Database schema
├── src/                     # Source code
└── VERCEL_DEPLOYMENT_GUIDE.md  # Detailed guide
```

## 🚨 Common Issues

### Build Errors
```bash
# ตรวจสอบ TypeScript
npm run type-check

# ตรวจสอบ build
npm run build
```

### Database Connection
- ตรวจสอบ `DATABASE_URL` ใน Vercel
- ตรวจสอบ database external access
- รัน `npm run vercel-build` เพื่อ auto-migrate

## 📱 Test After Deploy

1. ✅ หน้าแรกโหลดได้
2. ✅ ลงทะเบียนสมาชิกใหม่
3. ✅ ล็อกอินเข้าสู่ระบบ
4. ✅ ใช้ฟีเจอร์ลืมรหัสผ่าน
5. ✅ จองสนามบอล

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Prisma Docs](https://www.prisma.io/docs)

---

**Need Help?** ดูรายละเอียดเพิ่มเติมใน `VERCEL_DEPLOYMENT_GUIDE.md`

