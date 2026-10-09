"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type FormState } from "@/app/actions";

export function AuthForm({ mode }: { mode: "register" | "login" }) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState<FormState, FormData>(isRegister ? registerAction : loginAction, {});
  return (
    <main id="main" className="mx-auto w-full max-w-md flex-1 p-5 pt-10">
      <p className="eyebrow">Akwaaba Metropolitan University</p>
      <h1 className="h-display mt-2 text-3xl">{isRegister ? "Start your first year" : "Welcome back"}</h1>
      <form action={action} className="card mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 font-semibold">
          Email
          <input className="field" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Password
          <input className="field" name="password" type="password" required minLength={isRegister ? 10 : 1} maxLength={72}
            autoComplete={isRegister ? "new-password" : "current-password"} aria-describedby={isRegister ? "pw-hint" : undefined} />
          {isRegister && <span id="pw-hint" className="text-sm font-normal text-ink-soft">At least 10 characters.</span>}
        </label>
        <p role="alert" className="min-h-5 text-sm font-semibold text-clay-deep">{state.error}</p>
        <button className="btn-primary" disabled={pending}>{pending ? "One moment…" : isRegister ? "Create account" : "Log in"}</button>
      </form>
      <p className="mt-5 text-center text-ink-soft">
        {isRegister ? "Already enrolled? " : "New here? "}
        <Link className="font-bold text-forest underline" href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link>
      </p>
      {isRegister && <p className="mt-4 text-center text-sm text-ink-soft">We store your email and a hashed password. Nothing else is collected.</p>}
    </main>
  );
}
