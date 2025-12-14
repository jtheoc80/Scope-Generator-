'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import Link from "next/link";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | ScopeGen";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "ScopeGen privacy policy. Learn how we collect, use, and protect your personal information.");
    }
  }, []);

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-8">
            Privacy Policy
          </h1>
          <p className="text-slate-600 mb-8">Last updated: December 12, 2025</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-700 mb-4">
                Lead Ledger LLC, operating as ScopeGen ("we," "our," or "us"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our contractor proposal software and website at scopegenerator.com (the "Service").
              </p>
              <p className="text-slate-700">
                By using the Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">Personal Information</h3>
              <p className="text-slate-700 mb-4">When you use ScopeGen, we may collect:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Name and email address (when you create an account)</li>
                <li>Business name and contact information</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Proposal data you create (client names, project details, pricing)</li>
              </ul>

              <h3 className="text-xl font-bold text-slate-800 mb-3">Automatically Collected Information</h3>
              <p className="text-slate-700 mb-4">We automatically collect certain information when you visit our website:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues or fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">4. Analytics and Tracking</h2>
              <p className="text-slate-700 mb-4">We use the following third-party analytics services:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li><strong>Google Analytics:</strong> To understand how visitors interact with our website. Google Analytics uses cookies to collect anonymous traffic data.</li>
                <li><strong>Microsoft Clarity:</strong> To analyze user behavior through heatmaps and session recordings. Clarity helps us improve user experience.</li>
              </ul>
              <p className="text-slate-700">
                You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-slate-700 mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our business (payment processing, hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">6. Data Security</h2>
              <p className="text-slate-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">7. Data Retention</h2>
              <p className="text-slate-700 mb-4">
                We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">8. Your Rights</h2>
              <p className="text-slate-700 mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
              </ul>
              <p className="text-slate-700">
                To exercise these rights, please contact us at support@scopegenerator.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">9. Children's Privacy</h2>
              <p className="text-slate-700">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-slate-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">11. Contact Us</h2>
              <p className="text-slate-700">
                If you have any questions about this Privacy Policy, please contact us at support@scopegenerator.com.
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
