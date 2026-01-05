"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface TestSignInFormProps {
  redirectUrl: string;
}

/**
 * Test-only sign-in form for e2e testing.
 * This component is only rendered when AUTH_MODE=test.
 * 
 * It provides a predictable, testable form without relying on Clerk's
 * external authentication flow. Uses the /api/qa/test-login endpoint.
 */
export function TestSignInForm({ redirectUrl }: TestSignInFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/qa/test-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          router.push(redirectUrl);
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.error || "Sign in failed. Please check your credentials.");
        }
      } catch {
        setError("An error occurred. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="emailAddress"
          data-testid="signin-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
                     placeholder-slate-400 focus:outline-none focus:ring-2 
                     focus:ring-orange-500 focus:border-orange-500"
          autoComplete="email"
          autoFocus
        />
      </div>

      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          data-testid="signin-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
                     placeholder-slate-400 focus:outline-none focus:ring-2 
                     focus:ring-orange-500 focus:border-orange-500"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
          data-testid="signin-error"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        data-testid="auth-submit"
        disabled={isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-orange-500 hover:bg-orange-600 focus:outline-none 
                   focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
