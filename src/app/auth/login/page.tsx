import { LoginForm } from "./ui/LoginForm"

export default function Login() {
  return (
    <main className="min-h-dvh grid place-items-center px-4 py-24">
      <section
        className="w-full max-w-md rounded-2xl bg-card shadow-soft border p-6 md:p-8"
        aria-labelledby="login-heading"
      >
        <h1 id="login-heading" className="text-3xl font-bold tracking-tight text-center">
          Ingresar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Accedé con tu correo y contraseña
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
