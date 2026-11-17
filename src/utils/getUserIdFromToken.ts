import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

type TokenPayload = {
  id?: number | string;
  sub?: number | string;
};

export const getUserIdFromToken = (): number | null => {
  const token = Cookies.get("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const rawId = decoded.id ?? decoded.sub;
    const userId = Number(rawId);
    return Number.isFinite(userId) ? userId : null;
  } catch (error) {
    console.error("Error decoding token", error);
    return null;
  }
};
