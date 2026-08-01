import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const publicPaths = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ];
      const isPublic = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );
      if (isPublic) return true;
      return !!auth?.user;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.email = session.email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
