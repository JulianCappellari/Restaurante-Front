"use client"

import { useEffect, useId, useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useLogin } from "@/hooks/useLogin"

export const LoginForm = () => {
  const router = useRouter()
  const { login, isLoading, errorMessage } = useLogin()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const emailId = useId()
  const pwdId = useId()
  const errId = useId()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    const formData = new FormData(event.currentTarget)
    const email = (formData.get("email") as string)?.trim()
    const password = (formData.get("password") as string) ?? ""
    const ok = await login(email, password)
    if (ok) setIsAuthenticated(true)
  }

  useEffect(() => { if (isAuthenticated) router.push("/") }, [isAuthenticated, router])

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor={emailId} className="text-sm font-medium">Correo electrónico</label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
          placeholder="example@email.com"
          aria-invalid={Boolean(errorMessage) || undefined}
          aria-describedby={errorMessage ? errId : undefined}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor={pwdId} className="text-sm font-medium">Contraseña</label>
        <div className="relative">
          <input
            id={pwdId}
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            className="w-full rounded-xl border px-4 py-2.5 pr-10 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
            placeholder="••••••••"
            aria-invalid={Boolean(errorMessage) || undefined}
            aria-describedby={errorMessage ? errId : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute inset-y-0 right-2 grid place-items-center px-1 text-muted-foreground hover:opacity-80"
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPwd ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Error */}
      <div className="min-h-5" aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <p id={errId} className="mt-1 flex items-start gap-2 text-sm text-red-600">
            <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      {/* Submit */}
      <LoginButton isPending={isLoading} />

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px w-full bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <div className="h-px w-full bg-border" />
      </div>

      {/* Register */}
      <Link href="/auth/register" className="btn-outline w-full text-center">
        Crear una nueva cuenta
      </Link>
    </form>
  )
}

function LoginButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      className={clsx("btn-primary w-full", { "opacity-60 pointer-events-none": isPending })}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? "Ingresando..." : "Ingresar"}
    </button>
  )
}
