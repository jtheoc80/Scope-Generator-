"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface TestSignUpFormProps {
  redirectUrl: string;
}

/**
 * Test-only sign-up form for e2e testing.
 * This component is only rendered when AUTH_MODE=test.
 * 
 * It provides a predictable, testable form without relying on Clerk's
 * external authentication flow. Uses the /api/qa/test-signup endpoint.
 */
export function TestSignUpForm({ redirectUrl }: TestSignUpFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/qa/test-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (response.ok) {
          router.push(redirectUrl);
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.error || "Sign up failed. Please try again.");
        }
      } catch {
        setError("An error occurred. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="firstName" 
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            First name
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            data-testid="signup-firstname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
                       placeholder-slate-400 focus:outline-none focus:ring-2 
                       focus:ring-orange-500 focus:border-orange-500"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label 
            htmlFor="lastName" 
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            data-testid="signup-lastname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
                       placeholder-slate-400 focus:outline-none focus:ring-2 
                       focus:ring-orange-500 focus:border-orange-500"
            autoComplete="family-name"
          />
        </div>
      </div>

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
          data-testid="signup-email"
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
          data-testid="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password (min 8 characters)"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
                     placeholder-slate-400 focus:outline-none focus:ring-2 
                     focus:ring-orange-500 focus:border-orange-500"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
          data-testid="signup-error"
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
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
