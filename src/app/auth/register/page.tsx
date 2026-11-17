import Link from "next/link";
import FormularioDeRegistro from "./ui/FormularioDeDregistro";
import { customerReturn } from "@/lib/customer-return";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  const returnTo = customerReturn((await searchParams).redirect);
  return (
    <section className="w-full rounded-2xl border bg-white p-5 sm:p-8" aria-labelledby="register-heading">
      <div className="mb-6 space-y-2">
        <h1 id="register-heading" className="text-4xl text-cliente-ink">
          Crear cuenta
        </h1>
        <p className="text-sm text-cliente-muted">
          Completá tus datos para registrarte.
        </p>
      </div>

      <FormularioDeRegistro returnTo={returnTo} />

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tenés una cuenta?{" "}
        <Link href={`/auth/login?redirect=${encodeURIComponent(returnTo)}`} className="font-semibold text-primario-700 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
