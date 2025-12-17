import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/authUtils";
import { Hammer, CheckCircle2 } from "lucide-react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/dashboard";
  const selectedPlan = params?.plan;

  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in isn't available right now because authentication isn't configured.
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding and benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ScopeGen</span>
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
            <div className="bg-orange-500 p-2 rounded-lg">
              <Hammer className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ScopeGen</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to your account</h2>
            <p className="text-slate-600">
              Welcome back! Please enter your details.
            </p>
          </div>
          
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
              },
            }}
            fallbackRedirectUrl={redirectUrl}
            signUpUrl={`/sign-up${selectedPlan ? `?plan=${selectedPlan}` : ''}`}
          />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link 
                href={`/sign-up${selectedPlan ? `?plan=${selectedPlan}&redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign up for free
              </Link>
            </p>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-500">
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
