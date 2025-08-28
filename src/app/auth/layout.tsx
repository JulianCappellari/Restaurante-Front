import { getServerSession } from "next-auth"
import { authConfig } from "@/auth.config"
import { redirect } from "next/navigation"

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authConfig)
  if (session?.user) redirect("/")

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
