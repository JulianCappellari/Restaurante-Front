import jwt from 'jsonwebtoken';

export function getUserFromToken(token: string) {
  try {
    // console.log("Verifying token with secret:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("Decoded token:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}