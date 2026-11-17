import ClientProfilePage from "@/components/cuenta/perfil/ClientProfilePage";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userEmail = getUserFromToken(token)?.email ?? null;

  return <ClientProfilePage userEmail={userEmail} />;
}
