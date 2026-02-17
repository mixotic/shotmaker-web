import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan: string;
      credits: number;
    };
  }

  interface User {
    id: string;
    plan?: string;
    credits?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan: string;
    credits: number;
  }
}
