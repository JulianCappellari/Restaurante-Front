import ClientProfilePage from '@/components/cuenta/perfil/ClientProfilePage';
import { getUserFromToken } from '@/utils/getUserFromToken';
import { cookies } from 'next/headers';


export default function ProfilePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const userEmail = token ? getUserFromToken(token)?.email : null;
  console.log("userEmail", userEmail);

  return <ClientProfilePage userEmail={userEmail} />;
}
