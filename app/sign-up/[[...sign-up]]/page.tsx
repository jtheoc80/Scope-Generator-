import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/authUtils";
import { CheckCircle2 } from "lucide-react";
import { TestSignUpForm } from "./test-signup-form";

/**
 * Check if we're in test auth mode (for e2e testing without real Clerk)
 */
function isTestAuthMode(): boolean {
  return process.env.AUTH_MODE === 'test' || process.env.NEXT_PUBLIC_AUTH_MODE === 'test';
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/dashboard";
  const selectedPlan = params?.plan;
  const testMode = isTestAuthMode();

  // In test mode, render a predictable test-friendly form
  if (testMode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
        data-testid="signup-page"
      >
        <div 
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="signup-form"
        >
          <h1 className="text-xl font-semibold text-slate-900 mb-4">Create account</h1>
          <p className="text-sm text-slate-600 mb-6">
            Test authentication mode is active.
          </p>
          <TestSignUpForm redirectUrl={redirectUrl} />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link 
                href="/sign-in"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isClerkConfigured()) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
        data-testid="signup-page"
      >
        <div 
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="signup-form"
        >
          <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign up isn&apos;t available right now because authentication isn&apos;t configured.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            To enable Clerk, set <code className="rounded bg-slate-100 px-1 py-0.5">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            and <code className="rounded bg-slate-100 px-1 py-0.5">CLERK_SECRET_KEY</code>.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="signup-page">
      {/* Left side - Branding and benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center mb-12">
            <span className="text-3xl font-heading font-bold tracking-tight" style={{ color: '#ffffff' }}>
              Scope<span style={{ color: '#f97316' }}>Gen.</span>
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-6">
            Start creating professional proposals today
          </h1>
          <p className="text-lg text-slate-300 mb-10">
            Join hundreds of contractors who save hours every week with automated proposal generation.
          </p>
          
          {selectedPlan && (
            <div className="mb-10 p-4 bg-orange-500/20 border border-orange-500/40 rounded-xl">
              <p className="text-orange-400 font-semibold text-sm uppercase tracking-wide mb-1">
                Selected Plan
              </p>
              <p className="text-xl font-bold text-white capitalize">
                {selectedPlan === 'pro' ? 'Pro - $29/month' : selectedPlan === 'crew' ? 'Crew - $79/month' : selectedPlan}
              </p>
            </div>
          )}
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Generate proposals in under 60 seconds</p>
                <p className="text-slate-400">No more hours spent writing from scratch</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Trade-specific templates</p>
                <p className="text-slate-400">Built for bathroom, kitchen, roofing, HVAC, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Professional PDF export</p>
                <p className="text-slate-400">Send polished proposals that win jobs</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Lead Ledger LLC. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Sign up form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-heading font-bold tracking-tight" style={{ color: '#0f172a' }}>
              Scope<span style={{ color: '#f97316' }}>Gen.</span>
            </span>
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-600">
              Get started with your free proposal today
            </p>
          </div>
          
          <div data-testid="signup-form">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-xl border border-slate-200 rounded-xl",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-slate-300 hover:bg-slate-50",
                  formButtonPrimary: "bg-orange-500 hover:bg-orange-600",
                  footerActionLink: "text-orange-600 hover:text-orange-700",
                },
              }}
              fallbackRedirectUrl={redirectUrl}
              signInUrl={`/sign-in${selectedPlan ? `?plan=${selectedPlan}` : ''}`}
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link 
                href={`/sign-in${selectedPlan ? `?plan=${selectedPlan}&redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-500">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
