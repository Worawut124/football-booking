// /lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // บอก TypeScript ว่า มี prisma อยู่ใน global แล้ว
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ["query"], // ถ้าอยากดู query ที่ยิงออกไป
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
