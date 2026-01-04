'use client';
import Layout from "@/components/layout";
import Link from "next/link";
import { Building2, MapPin, Mail, Phone, Target, Users, Award } from "lucide-react";

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            About Lead Ledger Pro LLC
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Empowering contractors with professional tools to grow their business
          </p>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Lead Ledger Pro LLC was founded with a simple mission: to help hardworking contractors spend less time on paperwork and more time doing what they do best—building, remodeling, and transforming spaces.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Based in Houston, Texas, we understand the challenges that small contractors face. From late-night proposal writing to chasing down clients for signatures, we&apos;ve seen it all. That&apos;s why we built ScopeGen—a tool designed by people who get it.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our team is dedicated to creating software that&apos;s simple, powerful, and tailored to the trades. No complicated setups, no steep learning curves—just tools that work as hard as you do.
              </p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-secondary" />
                Company Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Location</p>
                    <p className="text-muted-foreground">Houston, Texas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-muted-foreground">support@leadledgerpro.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Business Hours</p>
                    <p className="text-muted-foreground">Monday - Friday, 9am - 5pm CST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Our Values</h2>
            <p className="text-muted-foreground">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Simplicity</h3>
              <p className="text-muted-foreground">
                We believe powerful tools shouldn&apos;t be complicated. Everything we build is designed to be intuitive and easy to use.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Contractor-First</h3>
              <p className="text-muted-foreground">
                Every feature we build starts with one question: &quot;Will this help contractors win more jobs and save time?&quot;
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Quality</h3>
              <p className="text-muted-foreground">
                Just like you take pride in your craftsmanship, we take pride in building software that works flawlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold text-white mb-6">
            Ready to streamline your proposals?
          </h2>
          <Link 
            href="/app" 
            className="inline-block bg-secondary text-slate-900 font-bold text-lg px-8 py-4 rounded-md hover:bg-white hover:text-primary transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </Layout>
  );
}
