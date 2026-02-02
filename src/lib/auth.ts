import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Bypass Auth Mode - set to true to skip authentication
const BYPASS_AUTH = process.env.BYPASS_AUTH === "true";

// Dev user for bypass mode
const DEV_USER = {
  id: "dev-user-id",
  email: "dev@example.com",
  name: "Dev User",
};

export const authOptions: AuthOptions = {
  adapter: BYPASS_AUTH ? undefined : (PrismaAdapter(prisma) as any),
  providers: [
    // Credentials provider for bypass/dev mode
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (BYPASS_AUTH) {
          // Auto-create dev user in database if not exists
          let user = await prisma.user.findUnique({
            where: { email: DEV_USER.email },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: DEV_USER.email,
                name: DEV_USER.name,
              },
            });
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
        return null;
      },
    }),
    // Google OAuth (only if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/",
  },
};

// Helper to get session with bypass support
export async function getAuthSession() {
  if (BYPASS_AUTH) {
    // Return mock session for bypass mode
    let user = await prisma.user.findUnique({
      where: { email: DEV_USER.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: DEV_USER.email,
          name: DEV_USER.name,
        },
      });
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  
  const { getServerSession } = await import("next-auth");
  return getServerSession(authOptions);
}
