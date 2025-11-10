require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

// สร้าง Supabase client ด้วย service role key (ถ้ามี) หรือ anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ฟังก์ชันอัพโหลดไฟล์ไปยัง Supabase
async function uploadToSupabase(filePath, bucket, folder) {
  try {
    const fileName = path.basename(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const fullPath = `${folder}/${fileName}`;

    // กำหนด MIME type ตามนามสกุลไฟล์
    let contentType = 'image/jpeg'; // default
    const ext = path.extname(fileName).toLowerCase();
    
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileBuffer, {
        contentType: contentType,
        upsert: false
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// ฟังก์ชัน migrate announcements
async function migrateAnnouncements() {
  console.log('Migrating announcements...');
  
  const announcements = await prisma.announcement.findMany({
    where: {
      image: {
        not: null,
        startsWith: '/uploads/'
      }
    }
  });

  for (const announcement of announcements) {
    if (announcement.image && announcement.image.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', announcement.image);
      
      try {
        await fs.access(filePath);
        const supabaseUrl = await uploadToSupabase(filePath, 'announcements', 'images');
        
        if (supabaseUrl) {
          await prisma.announcement.update({
            where: { id: announcement.id },
            data: { image: supabaseUrl }
          });
          console.log(`Migrated announcement ${announcement.id}: ${announcement.image} -> ${supabaseUrl}`);
          
          // ลบไฟล์เก่า
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error(`File not found or error: ${filePath}`);
      }
    }
  }
}

// ฟังก์ชัน migrate competitions
async function migrateCompetitions() {
  console.log('Migrating competitions...');
  
  const competitions = await prisma.competition.findMany({
    where: {
      imageName: {
        not: null
      }
    }
  });

  for (const competition of competitions) {
    if (competition.imageName && !competition.imageName.startsWith('http')) {
      const filePath = path.join(process.cwd(), 'public/uploads', competition.imageName);
      
      try {
        await fs.access(filePath);
        const supabaseUrl = await uploadToSupabase(filePath, 'competitions', 'images');
        
        if (supabaseUrl) {
          await prisma.competition.update({
            where: { id: competition.id },
            data: { imageName: supabaseUrl }
          });
          console.log(`Migrated competition ${competition.id}: ${competition.imageName} -> ${supabaseUrl}`);
          
          // ลบไฟล์เก่า
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error(`File not found or error: ${filePath}`);
      }
    }
  }
}

// ฟังก์ชัน migrate products
async function migrateProducts() {
  console.log('Migrating products...');
  
  const products = await prisma.product.findMany({
    where: {
      imageData: {
        not: null
      }
    }
  });

  for (const product of products) {
    if (product.imageData && product.imageData.length > 1000) { // base64 data
      try {
        // แปลง base64 เป็น buffer
        const buffer = Buffer.from(product.imageData, 'base64');
        const fileName = `product-${product.id}-${Date.now()}.jpg`;
        
        const fullPath = `images/${fileName}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(fullPath, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error(`Error uploading product ${product.id}:`, error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fullPath);

        await prisma.product.update({
          where: { id: product.id },
          data: { imageData: urlData.publicUrl }
        });
        console.log(`Migrated product ${product.id}: base64 -> ${urlData.publicUrl}`);
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
      }
    }
  }
}

// ฟังก์ชัน migrate competition registrations
async function migrateCompetitionRegistrations() {
  console.log('Migrating competition registrations...');
  
  const registrations = await prisma.competitionRegistration.findMany({
    where: {
      depositFileName: {
        not: null
      }
    }
  });

  for (const registration of registrations) {
    if (registration.depositFileName && !registration.depositFileName.startsWith('http')) {
      const filePath = path.join(process.cwd(), 'public/uploads', registration.depositFileName);
      
      try {
        await fs.access(filePath);
        const supabaseUrl = await uploadToSupabase(filePath, 'competition-registrations', 'deposits');
        
        if (supabaseUrl) {
          await prisma.competitionRegistration.update({
            where: { id: registration.id },
            data: { depositFileName: supabaseUrl }
          });
          console.log(`Migrated registration ${registration.id}: ${registration.depositFileName} -> ${supabaseUrl}`);
          
          // ลบไฟล์เก่า
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error(`File not found or error: ${filePath}`);
      }
    }
  }
}

// ฟังก์ชัน migrate payment config
async function migratePaymentConfig() {
  console.log('Migrating payment config...');
  
  const paymentConfig = await prisma.paymentConfig.findFirst();
  
  if (paymentConfig && paymentConfig.qrCode && paymentConfig.qrCode.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', paymentConfig.qrCode);
    
    try {
      await fs.access(filePath);
      const supabaseUrl = await uploadToSupabase(filePath, 'payment-config', 'images');
      
      if (supabaseUrl) {
        await prisma.paymentConfig.update({
          where: { id: paymentConfig.id },
          data: { qrCode: supabaseUrl }
        });
        console.log(`Migrated payment config: ${paymentConfig.qrCode} -> ${supabaseUrl}`);
        
        // ลบไฟล์เก่า
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`File not found or error: ${filePath}`);
    }
  }
}

// ฟังก์ชัน migrate payments
async function migratePayments() {
  console.log('Migrating payments...');
  
  const payments = await prisma.payment.findMany({
    where: {
      proof: {
        not: null,
        startsWith: '/uploads/'
      }
    }
  });

  for (const payment of payments) {
    if (payment.proof && payment.proof.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', payment.proof);
      
      try {
        await fs.access(filePath);
        const supabaseUrl = await uploadToSupabase(filePath, 'payments', 'proofs');
        
        if (supabaseUrl) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { proof: supabaseUrl }
          });
          console.log(`Migrated payment ${payment.id}: ${payment.proof} -> ${supabaseUrl}`);
          
          // ลบไฟล์เก่า
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error(`File not found or error: ${filePath}`);
      }
    }
  }
}

// ฟังก์ชัน migrate orders
async function migrateOrders() {
  console.log('Migrating orders...');
  
  const orders = await prisma.order.findMany({
    where: {
      slipImage: {
        not: null
      }
    }
  });

  for (const order of orders) {
    if (order.slipImage && order.slipImage.length > 1000) { // base64 data
      try {
        // แปลง base64 เป็น buffer
        const buffer = Buffer.from(order.slipImage, 'base64');
        const fileName = `order-${order.id}-${Date.now()}.jpg`;
        
        const fullPath = `slips/${fileName}`;

        const { data, error } = await supabase.storage
          .from('orders')
          .upload(fullPath, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error(`Error uploading order ${order.id}:`, error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('orders')
          .getPublicUrl(fullPath);

        await prisma.order.update({
          where: { id: order.id },
          data: { slipImage: urlData.publicUrl }
        });
        console.log(`Migrated order ${order.id}: base64 -> ${urlData.publicUrl}`);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }
  }
}

// ฟังก์ชันหลัก
async function migrateToSupabase() {
  try {
    console.log('Starting migration to Supabase...');
    
    await migrateAnnouncements();
    await migrateCompetitions();
    await migrateProducts();
    await migrateCompetitionRegistrations();
    await migratePaymentConfig();
    await migratePayments();
    await migrateOrders();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รัน migration
if (require.main === module) {
  migrateToSupabase();
}

module.exports = { migrateToSupabase };
