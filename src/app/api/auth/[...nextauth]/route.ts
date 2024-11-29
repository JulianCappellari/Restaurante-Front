import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const GET = NextAuth(authConfig);
export const POST = NextAuth(authConfig);
