// next-auth.d.ts
import { DefaultSession } from "next-auth";
import { AdapterUser as CoreAdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      phone?: string | null;  
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone?: string | null;   
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends CoreAdapterUser {
    name: string | null;
    role: string;
    phone?: string | null;   
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string | null;   
  }
}
