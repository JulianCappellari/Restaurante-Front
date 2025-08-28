
import Link from 'next/link';
import FormularioDeRegistro from './ui/FormularioDeDregistro';

export default function RegisterPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-4 py-24">
      <section
        className="w-full max-w-md rounded-2xl bg-card shadow-soft border p-6 md:p-8"
        aria-labelledby="register-heading"
      >
        <div className="space-y-1 text-center mb-8">
          <h1 id="register-heading" className="text-3xl font-bold tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Completa tus datos para registrarte
          </p>
        </div>
        
        <FormularioDeRegistro />
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link 
            href="/auth/login" 
            className="font-medium text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}