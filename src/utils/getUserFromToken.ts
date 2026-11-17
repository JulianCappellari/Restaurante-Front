import jwt, { JwtPayload } from "jsonwebtoken";

export type AppJwtPayload = JwtPayload & {
  id?: number | string;
  email?: string;
  role?: string;
};

const normalizePayload = (decoded: string | JwtPayload | null): AppJwtPayload | null => {
  if (!decoded || typeof decoded === "string") return null;
  return decoded as AppJwtPayload;
};

export function getUserFromToken(token?: string | null): AppJwtPayload | null {
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = secret ? jwt.verify(token, secret) : jwt.decode(token);
    return normalizePayload(decoded);
  } catch {
    return normalizePayload(jwt.decode(token));
  }
}
