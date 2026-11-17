import { LoginForm } from "./ui/LoginForm";
import { customerReturn } from "@/lib/customer-return";

export default async function Login({ searchParams }: { searchParams: Promise<{ redirect?: string | string[]; registered?: string }> }) {
  const params = await searchParams;
  return (
    <section className="w-full rounded-2xl border bg-white p-5 sm:p-8" aria-labelledby="login-heading">
      <h1 id="login-heading" className="text-4xl text-cliente-ink">
        Ingresar
      </h1>
      <p className="mt-2 text-sm text-cliente-muted">
        Entrá con tu correo y contraseña.
      </p>
      <div className="mt-6">
        {params.registered === "true" && <p className="mb-4 rounded-lg bg-cliente-sage p-3 text-sm" role="status">Tu cuenta está lista. Iniciá sesión para continuar.</p>}
        <LoginForm returnTo={customerReturn(params.redirect)} />
      </div>
    </section>
  );
}
