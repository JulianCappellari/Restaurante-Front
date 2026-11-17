"use client";

import { useId, useState } from "react";
import type React from "react";
import clsx from "clsx";
import Link from "next/link";
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useLogin";

export const LoginForm = ({ returnTo }: { returnTo: string }) => {
  const router = useRouter();
  const { login, isLoading, errorMessage } = useLogin();
  const [showPwd, setShowPwd] = useState(false);

  const emailId = useId();
  const pwdId = useId();
  const errId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string) ?? "";
    const ok = await login(email, password);
    if (ok) router.replace(returnTo);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={emailId} className="text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
          placeholder="example@email.com"
          aria-invalid={Boolean(errorMessage) || undefined}
          aria-describedby={errorMessage ? errId : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={pwdId} className="text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            id={pwdId}
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            className="w-full rounded-lg border px-4 py-2.5 pr-10 text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
            placeholder="********"
            aria-invalid={Boolean(errorMessage) || undefined}
            aria-describedby={errorMessage ? errId : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPwd((value) => !value)}
            className="absolute inset-y-0 right-2 grid place-items-center px-1 text-gray-500 hover:text-gray-700"
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPwd ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="min-h-5" aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <p id={errId} className="mt-1 flex items-start gap-2 text-sm text-red-600">
            <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      <LoginButton isPending={isLoading} />

      <div className="flex items-center gap-3 py-1">
        <div className="h-px w-full bg-gray-200" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px w-full bg-gray-200" />
      </div>

      <Link href={`/auth/register?redirect=${encodeURIComponent(returnTo)}`} className="btn-outline customer-press w-full rounded-lg text-center">
        Crear una nueva cuenta
      </Link>
    </form>
  );
};

function LoginButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      className={clsx("btn-primary w-full rounded-lg", {
        "pointer-events-none opacity-60": isPending,
      })}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}
