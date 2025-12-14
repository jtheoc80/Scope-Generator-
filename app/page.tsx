import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, DollarSign, FileCheck, Hammer, Users, Star, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="bg-orange-500 p-2 rounded-sm">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold uppercase tracking-tight">
                ScopeGen
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Professional Proposals <br/>
              <span className="text-orange-500">in 60 Seconds</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Generate professional proposals and scopes of work in seconds. Built for bathroom remodelers, painters, HVAC specialists, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
              <Link 
                href="/app" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 transition-all hover:scale-105 shadow-lg"
              >
                Try a Free Proposal
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a 
                href="#how-it-works" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors backdrop-blur-sm"
              >
                Learn How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-800 border-y border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4 text-white">
              <Users className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">500+</span>
              <span className="text-slate-300 text-base">Proposals Generated</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-white">
              <Star className="w-6 h-6 text-orange-500 fill-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">4.9★</span>
              <span className="text-slate-300 text-base">Contractor Rating</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-white">
              <TrendingUp className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">$2.5M+</span>
              <span className="text-slate-300 text-base">in Won Jobs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-8">
              Tired of writing proposals after a 10-hour day?
            </h2>
            <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed mb-12">
              ScopeGen lets remodelers, roofers, HVAC, plumbing, and electrical contractors build detailed proposals in about 60 seconds — no Word templates, no copy-paste, no guessing at scope.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <FileCheck className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">Pre-built Scopes</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  Ready-to-use scopes for bathrooms, kitchens, roofing, HVAC, electrical, landscaping, and more.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">Clear Line-Items</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  Descriptions your homeowners actually understand — no confusing contractor jargon.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">Consistent Pricing</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  Structured pricing so you don&apos;t underbid jobs or leave money on the table.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <Link 
                href="/app" 
                className="inline-flex items-center justify-center h-14 px-10 rounded-md bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all"
              >
                Create your first proposal free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              How ScopeGen Works
            </h2>
            <p className="text-slate-400 text-lg sm:text-xl">
              Three simple steps to create proposals that win jobs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-6xl font-bold text-orange-500 mb-6">1</div>
              <h3 className="text-xl font-bold text-white mb-4">Pick Your Trade</h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Select your trade — bathroom, kitchen, roofing, HVAC, plumbing, electrical — and choose the job type.
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-6xl font-bold text-orange-500 mb-6">2</div>
              <h3 className="text-xl font-bold text-white mb-4">Answer Quick Questions</h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Project size, materials, and add-ons. Takes about 30 seconds.
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-6xl font-bold text-orange-500 mb-6">3</div>
              <h3 className="text-xl font-bold text-white mb-4">Send Your Proposal</h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Get a professional PDF or email it directly to your customer.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-base">Save hours every week</span>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-orange-500" />
              <span className="text-base">Look like a pro</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <span className="text-base">Close deals faster</span>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/app"
              className="inline-flex items-center justify-center h-14 px-10 rounded-md bg-orange-500 text-white font-bold text-lg hover:bg-white hover:text-slate-900 transition-all"
            >
              Create Your First Proposal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-base font-medium text-slate-500 uppercase tracking-wide">Trusted by Contractors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &ldquo;Game changer for my plumbing business. I used to spend hours on proposals—now it takes me 10 minutes.&rdquo;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">Mike R.</span>
                <span className="text-slate-400 ml-2">· Plumbing Contractor, TX</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &ldquo;My close rate went up 30% since I started using ScopeGen. The proposals look so professional.&rdquo;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">Sarah T.</span>
                <span className="text-slate-400 ml-2">· General Contractor, CA</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &ldquo;Finally, a tool built for contractors. The AI pricing suggestions are spot-on for my market.&rdquo;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">James L.</span>
                <span className="text-slate-400 ml-2">· Roofing Contractor, FL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to look like a pro?
          </h2>
          <Link 
            href="/app" 
            className="inline-block bg-orange-500 text-white font-bold text-lg px-10 py-4 rounded-md hover:bg-white hover:text-slate-900 transition-colors shadow-lg"
          >
            Create Your First Proposal — It&apos;s Free
          </Link>
          <p className="mt-4 text-slate-400 text-sm">Try free, then unlock with a Pro plan.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Hammer className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-bold text-white uppercase">ScopeGen</span>
          </div>
          <p className="text-center text-sm">
            Built for contractors who want to win more jobs.
          </p>
          <div className="text-center text-xs mt-8 pt-8 border-t border-slate-800">
            © {new Date().getFullYear()} Lead Ledger LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
