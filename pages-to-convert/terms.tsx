'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service | ScopeGen";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "ScopeGen terms of service. Read our terms and conditions for using our contractor proposal software.");
    }
  }, []);

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-8">
            Terms of Service
          </h1>
          <p className="text-slate-600 mb-8">Last updated: December 12, 2025</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-700 mb-4">
                By accessing or using ScopeGen, a service operated by Lead Ledger LLC ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
              </p>
              <p className="text-slate-700">
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-700 mb-4">
                ScopeGen is a contractor proposal software that helps contractors create professional proposals and scopes of work. The Service includes:
              </p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Proposal generation tools</li>
                <li>Scope of work templates</li>
                <li>PDF download capabilities</li>
                <li>Client management features</li>
                <li>E-signature functionality (for paid plans)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">3. Account Registration</h2>
              <p className="text-slate-700 mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">4. Subscription and Payment</h2>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">Pricing</h3>
              <p className="text-slate-700 mb-4">
                ScopeGen offers both free and paid subscription plans. Pricing is displayed on our website and may be updated from time to time.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mb-3">Billing</h3>
              <p className="text-slate-700 mb-4">
                Paid subscriptions are billed in advance on a monthly or annual basis. All payments are processed securely through Stripe.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mb-3">Refunds</h3>
              <p className="text-slate-700 mb-4">
                We offer refunds on a case-by-case basis. Please contact support@scopegenerator.com within 14 days of purchase to request a refund.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mb-3">Cancellation</h3>
              <p className="text-slate-700">
                You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">5. Acceptable Use</h2>
              <p className="text-slate-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Upload malicious code or content</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Use the Service to send spam or fraudulent communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">6. Intellectual Property</h2>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Content</h3>
              <p className="text-slate-700 mb-4">
                The Service, including its design, features, and content, is owned by ScopeGen and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mb-3">Your Content</h3>
              <p className="text-slate-700">
                You retain ownership of the proposals and content you create using the Service. By using the Service, you grant us a limited license to store, display, and process your content as necessary to provide the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-slate-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-slate-700">
                We do not warrant that the Service will be uninterrupted, error-free, or secure. We are not responsible for the accuracy of proposals you create using the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-slate-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCOPEGEN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
              </p>
              <p className="text-slate-700">
                Our total liability for any claim arising from or relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">9. Indemnification</h2>
              <p className="text-slate-700">
                You agree to indemnify and hold harmless ScopeGen, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">10. Termination</h2>
              <p className="text-slate-700">
                We may terminate or suspend your account and access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">11. Governing Law</h2>
              <p className="text-slate-700">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">12. Contact Information</h2>
              <p className="text-slate-700">
                For questions about these Terms, please contact us at support@scopegenerator.com.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link href="/" className="text-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
