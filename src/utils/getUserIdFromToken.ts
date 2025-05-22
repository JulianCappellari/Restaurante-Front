// utils/getUserIdFromToken.ts
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

export const getUserIdFromToken = (): number | null => {
  const token = Cookies.get("token");
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    // console.log(decoded.id);
    return decoded.id; // O la key que tengas en tu payload
  } catch (error) {
    console.error("Error decoding token", error);
    return null;
  }
};
