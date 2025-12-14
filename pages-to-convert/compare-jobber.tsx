'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareJobber() {
  useEffect(() => {
    document.title = "ScopeGen vs Jobber: Which Proposal Software is Right for You?";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Compare ScopeGen vs Jobber for contractor proposals. See the differences in pricing, features, and find out which tool is best for your business.");
    }
  }, []);

  return (
    <Layout>
      <article className="bg-white">
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="h1-compare-jobber">
                ScopeGen vs Jobber: Which Proposal Software is Right for You?
              </h1>
              <p className="text-xl text-slate-300 mb-8" data-testid="text-intro-jobber">
                Both ScopeGen and Jobber help home service professionals run their business, but they take different approaches. ScopeGen is a fast, focused proposal generator, while Jobber is a field service management platform with scheduling, invoicing, and CRM features. Here's how they compare.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 text-center" data-testid="h2-quick-comparison-jobber">
                Quick Comparison Table
              </h2>
              <div className="overflow-x-auto mb-16">
                <table className="w-full border-collapse bg-white rounded-xl border border-slate-200" data-testid="table-comparison-jobber">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900 border-b">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-orange-600 border-b">ScopeGen</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-600 border-b">Jobber</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Starting Price</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Free tier available</td>
                      <td className="py-4 px-6 text-center text-slate-600">$49/month</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Proposal Generation</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">60 seconds</td>
                      <td className="py-4 px-6 text-center text-slate-600">Manual</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Pre-built Templates</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">17+ trades</td>
                      <td className="py-4 px-6 text-center text-slate-600">Limited</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">E-signatures</td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Best For</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Small contractors</td>
                      <td className="py-4 px-6 text-center text-slate-600">Home service businesses</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Setup Time</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">5 minutes</td>
                      <td className="py-4 px-6 text-center text-slate-600">Hours</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-slate-700">Scheduling & Dispatch</td>
                      <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-what-is-scopegen">
                  What is ScopeGen?
                </h2>
                <p className="text-slate-600 mb-8">
                  ScopeGen is a proposal generator built specifically for contractors who need professional proposals fast. With pre-built scope templates for 17+ trades including roofing, HVAC, plumbing, electrical, remodeling, and more, you can create a complete proposal in about 60 seconds. There's no complex setup, no training required, and a free tier available to get started immediately.
                </p>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-what-is-jobber">
                  What is Jobber?
                </h2>
                <p className="text-slate-600 mb-8">
                  Jobber is a field service management platform designed for home service businesses like cleaning companies, lawn care, HVAC technicians, and similar trades. Starting at $49/month, it includes scheduling, dispatching, invoicing, CRM, and quote creation. It's a comprehensive platform that goes well beyond just proposals, offering tools to manage your entire operation.
                </p>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-key-differences-jobber">
                  Key Differences
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Pricing</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen offers a free tier to get started. Jobber starts at $49/month with higher tiers for additional features, which can add up quickly.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Ease of Use</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen is ready to use in minutes. Jobber requires more setup time to configure scheduling, client management, and other features.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Target Audience</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen serves all contractor trades focused on proposals. Jobber is optimized for recurring service businesses that need scheduling.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Feature Focus</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen focuses on creating detailed, professional proposals quickly. Jobber is a full business management suite with proposals as one feature.
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-scopegen-jobber">
                  When to Choose ScopeGen
                </h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You're a small contractor or solo operator
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You want proposals done in under a minute
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You focus on remodeling, roofing, HVAC, plumbing, electrical, or similar trades
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You don't want to pay for features you don't need
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You already have scheduling/invoicing tools you're happy with
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-jobber">
                  When to Choose Jobber
                </h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You run a recurring service business (cleaning, lawn care, maintenance)
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You need integrated scheduling, dispatching, and route optimization
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You want a CRM to manage client relationships and history
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You need built-in invoicing and payment processing
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-bottom-line-jobber">
                  The Bottom Line
                </h2>
                <p className="text-slate-600 mb-8">
                  If your main goal is creating professional, detailed proposals quickly, ScopeGen is the better choice. You'll save time and money by not paying for scheduling and CRM features you may not need. If you need a complete field service management system, Jobber might be worth the investment—but for proposals alone, try ScopeGen free and see for yourself.
                </p>
              </div>

              <div className="text-center py-8">
                <Link href="/app">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-cta-jobber">
                    Create Your First Proposal Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>
    </Layout>
  );
}
