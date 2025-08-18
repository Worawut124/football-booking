// next-auth.d.ts
import { DefaultSession } from "next-auth";
import { AdapterUser as CoreAdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null; // ปรับให้เป็น string | null
      role: string;        // เพิ่ม role
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string | null; // ปรับให้เป็น string | null
    role: string;        // เพิ่ม role
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends CoreAdapterUser {
    name: string | null; // ปรับให้เข้ากับ next-auth (ไม่รวม undefined)
    role: string;        // เพิ่ม role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // เพิ่ม role ใน JWT
  }
}