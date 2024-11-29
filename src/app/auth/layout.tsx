import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";  // Asegúrate de importar authConfig
import { redirect } from "next/navigation";

export default async function RestauranteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Iniciando RestauranteLayout...");

  try {
    // Obtén la sesión usando getServerSession
    const session = await getServerSession(authConfig);

    console.log("Sesión obtenida:", session);

    if (session?.user) {
      console.log("Sesión activa, redirigiendo...");
      redirect('/');
    }

    return (
      <main className="flex justify-center">
        <div className="w-full sm:w-[350px] px-10">
          {children}
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    return (
      <main className="flex justify-center">
        <div className="w-full sm:w-[350px] px-10">
          {children}
        </div>
      </main>
    );
  }
}
