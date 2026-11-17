import type { NextAuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { getUserByEmail } from "./actions/user/get-user-by-email";
import bcryptjs from "bcryptjs";

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && typeof token.role === "string") {
        session.user.role = token.role as User["role"];
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await getUserByEmail(email);

        if (!user) return null;

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: String(user.id),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
};
