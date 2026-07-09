// Edge-safe config: no Prisma imports here — this file is bundled
// into middleware. The credentials provider lives in src/auth.ts.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.clubId = (user as { clubId?: string | null }).clubId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { clubId?: string | null }).clubId =
          (token.clubId as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminArea) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
