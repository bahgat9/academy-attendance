"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 space-y-2">
          <p className="text-sm text-white/50">Private Admin Access</p>
          <h1 className="text-3xl font-semibold">Login</h1>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/70">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/70">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}