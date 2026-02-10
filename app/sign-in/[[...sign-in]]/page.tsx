import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/authUtils";
import { CheckCircle2, UserPlus, HelpCircle, ArrowRight } from "lucide-react";
import { TestSignInForm } from "./test-signin-form";

/**
 * Check if we're in test auth mode (for e2e testing without real Clerk)
 */
function isTestAuthMode(): boolean {
  return process.env.AUTH_MODE === 'test' || process.env.NEXT_PUBLIC_AUTH_MODE === 'test';
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/dashboard";
  console.log("Redirect URL:", redirectUrl);

  // Check if user is already signed in (skip in test mode)
  if (isClerkConfigured() && !isTestAuthMode()) {
    const { userId } = await auth();
    if (userId) {
      console.log("User is already signed in");
      redirect(redirectUrl);
    }
  }

  const selectedPlan = params?.plan;
  const testMode = isTestAuthMode();

  // In test mode, render a predictable test-friendly form
  if (testMode) {   
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
        data-testid="signin-page"
      >
        <div 
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="signin-form"
        >
          <h1 className="text-xl font-semibold text-slate-900 mb-4">Sign in</h1>
          <p className="text-sm text-slate-600 mb-6">
            Test authentication mode is active.
          </p>
          <TestSignInForm redirectUrl={redirectUrl} />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link 
                href="/sign-up"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign up
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
        data-testid="signin-page"
      >
        <div 
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="signin-form"
        >
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in isn&apos;t available right now because authentication isn&apos;t configured.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            To enable Clerk, set <code className="rounded bg-slate-100 px-1 py-0.5">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            and <code className="rounded bg-slate-100 px-1 py-0.5">CLERK_SECRET_KEY</code>.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Back home
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="signin-page">
      {/* Left side - Branding and benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/scopegen-logo.png" alt="ScopeGen logo" className="h-10 w-10 rounded-lg" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-slate-900">Scope</span>
              <span className="text-orange-500">Gen</span>
              <span className="text-orange-500">.</span>
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-6">
            Welcome back
          </h1>
          <p className="text-lg text-slate-300 mb-10">
            Sign in to continue creating professional proposals and managing your business.
          </p>
          
          {selectedPlan && (
            <div className="mb-10 p-4 bg-orange-500/20 border border-orange-500/40 rounded-xl">
              <p className="text-orange-400 font-semibold text-sm uppercase tracking-wide mb-1">
                Continue to Subscribe
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
                <p className="font-semibold text-white">Access your saved proposals</p>
                <p className="text-slate-400">Pick up right where you left off</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Track proposal performance</p>
                <p className="text-slate-400">See which proposals convert to jobs</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Manage your subscription</p>
                <p className="text-slate-400">Upgrade or adjust your plan anytime</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Lead Ledger LLC. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/scopegen-logo.png" alt="ScopeGen logo" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-slate-900">Scope</span>
              <span className="text-orange-500">Gen</span>
              <span className="text-orange-500">.</span>
            </span>
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to your account</h2>
            <p className="text-slate-600">
              Welcome back! Please enter your details.
            </p>
          </div>
          
          {/* Prominent Sign Up CTA - shown before sign-in form for new users */}
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  New to ScopeGen?
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Create a free account to start generating professional proposals in seconds.
                </p>
                <Link 
                  href={`/sign-up${selectedPlan ? `?plan=${selectedPlan}&redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          <div data-testid="signin-form">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-xl border border-slate-200 rounded-xl",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-slate-300 hover:bg-slate-50",
                  formButtonPrimary: "bg-orange-500 hover:bg-orange-600",
                  footerActionLink: "text-orange-600 hover:text-orange-700",
                  // Enhanced error styling for better visibility
                  formFieldErrorText: "text-red-600 font-medium",
                  alert: "bg-amber-50 border-amber-200 text-amber-800",
                  alertText: "text-amber-800",
                  // Style the "forgot password" and other links
                  formFieldAction: "text-orange-600 hover:text-orange-700",
                  // Make form fields more visible
                  formFieldInput: "border-slate-300 focus:border-orange-500 focus:ring-orange-500",
                  // Better styling for the divider
                  dividerLine: "bg-slate-200",
                  dividerText: "text-slate-500",
                  // Footer link styling
                  footerActionText: "text-slate-600",
                },
              }}
              fallbackRedirectUrl={redirectUrl}
              signUpUrl={`/sign-up${selectedPlan ? `?plan=${selectedPlan}` : ''}`}
            />
          </div>
          
          {/* Help section for users having trouble */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Having trouble signing in?</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• If you see &quot;Couldn&apos;t find your account&quot;, you may need to <Link href={`/sign-up${selectedPlan ? `?plan=${selectedPlan}&redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-orange-600 hover:text-orange-700 font-medium">create an account</Link> first</li>
                  <li>• Try signing in with Google if you used it before</li>
                  <li>• Check that your email is spelled correctly</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
