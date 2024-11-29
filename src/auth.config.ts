import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { getUserByEmail } from "./actions";
import bcryptjs from "bcryptjs";
import { getUserByEmail2 } from "./actions/user/get-user-by-email2";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  callbacks: {
    async session({ session, token }) {
      console.log("Sesión actual:", session);
      session.user = token.user;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log("Usuario autenticado (JWT):", user);
        token.user = user;
      }
      return token;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("Intentando autorizar con credenciales:", credentials);
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error("Las credenciales son inválidas");
        }

        const { email, password } = parsedCredentials.data;

        const user = await getUserByEmail2(email);
        console.log("Usario obtenido: ", user);
        // if (!user) return null;
        if (!user) {
          throw new Error("No se encontró el usuario");
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        // if (!isPasswordValid) return null;
        if (!isValidPassword) {
          throw new Error("Contraseña incorrecta");
        }

        const { password: _, ...rest } = user; // Exclude password from user object
        console.log("Usuario autorizado:", rest);
        return rest;
      },
    }),
  ],
};

export const { signIn, signOut, auth } = NextAuth(authConfig);
