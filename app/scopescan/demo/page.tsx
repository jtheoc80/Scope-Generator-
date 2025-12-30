'use client';

import { useState } from "react";
import Layout from "@/components/layout";
import Link from "next/link";
import Image from "next/image";
import { 
  Camera, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  DollarSign,
  ClipboardList,
  FileText,
  Star,
  Lock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/lib/scopescan-demo-data";

type PackageKey = "GOOD" | "BETTER" | "BEST";

/**
 * ScopeScan Demo Page
 * 
 * Allows unauthenticated users to explore ScopeScan with sample data.
 * Shows real AI-generated output without requiring sign-in.
 * Save/export features are disabled with clear messaging.
 */
export default function ScopeScanDemoPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(demoProjects[0].id);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("BETTER");

  const selectedProject = demoProjects.find((p) => p.id === selectedProjectId) || demoProjects[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      {/* Demo Mode Banner */}
      <div 
        className="bg-amber-50 border-b border-amber-200"
        data-testid="demo-mode-banner"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Demo mode — sign in to save proposals and analyze your own photos
              </span>
            </div>
            <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="demo-signin-cta">
              <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100">
                Sign In to Start
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <section className="bg-slate-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-xl shadow-lg mb-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3"
              data-testid="demo-page-headline"
            >
              See ScopeScan in Action
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              Explore sample projects analyzed by our AI. This is exactly what you&apos;ll get 
              when you scan your own job sites.
            </p>
          </div>
        </div>
      </section>

      {/* Main Demo Content */}
      <section className="py-8 sm:py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Project Selector */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                Select a Sample Project
              </h2>
              <div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                data-testid="demo-project-selector"
              >
                {demoProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    data-testid={`demo-project-${project.id}`}
                    className={`
                      relative rounded-xl overflow-hidden border-2 transition-all text-left
                      ${selectedProjectId === project.id 
                        ? "border-orange-500 ring-2 ring-orange-200" 
                        : "border-slate-200 hover:border-slate-300"}
                    `}
                  >
                    <div className="aspect-[4/3] relative bg-slate-100">
                      <Image
                        src={project.imageSrc}
                        alt={project.imageAlt}
                        fill
                        className="object-cover"
                      />
                      {selectedProjectId === project.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <p className="font-medium text-slate-900 text-sm">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Display */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Project Info */}
              <div className="lg:col-span-1 space-y-4">
                {/* Project Image */}
                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-slate-100 mb-3">
                      <Image
                        src={selectedProject.imageSrc}
                        alt={selectedProject.imageAlt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>AI-analyzed sample project</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Selection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pricing Packages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(["GOOD", "BETTER", "BEST"] as PackageKey[]).map((pkg) => {
                        const isSelected = selectedPackage === pkg;
                        const packageData = selectedProject.packages[pkg];
                        
                        return (
                          <button
                            key={pkg}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`
                              w-full p-3 rounded-lg border-2 transition-all text-left
                              ${isSelected 
                                ? "border-orange-500 bg-orange-50" 
                                : "border-slate-200 hover:border-slate-300"}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {pkg === "BETTER" && (
                                  <Star className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="font-semibold text-sm">{pkg}</span>
                                {pkg === "BETTER" && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(packageData.total)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{packageData.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA - Disabled in Demo */}
                <Card className="bg-slate-100 border-dashed">
                  <CardContent className="p-4 text-center">
                    <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Save & Export Disabled
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      Sign in to save proposals and send to customers
                    </p>
                    <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="demo-cta-signin">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Sign In to Start
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Scope Details */}
              <div className="lg:col-span-2 space-y-4">
                {/* Project Summary */}
                <Card data-testid="demo-project-summary">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-500" />
                        {selectedProject.name}
                      </CardTitle>
                      <Badge variant="outline">{selectedProject.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{selectedProject.summary}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Generated: {selectedProject.generatedAt}</span>
                      <span className="text-slate-500">{selectedProject.scopeItems.length} scope items</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Scope Items */}
                <Card data-testid="demo-scope-items">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Scope of Work ({selectedProject.scopeItems.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.scopeItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                        data-testid={`demo-scope-item-${index}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 ml-6">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-slate-700 shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Total Pricing */}
                <Card className="bg-slate-900 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">{selectedPackage} Package Total</p>
                        <p className="text-3xl font-heading font-bold">
                          {formatCurrency(selectedProject.packages[selectedPackage].total)}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          {selectedProject.packages[selectedPackage].label}
                        </p>
                      </div>
                      <div className="text-right">
                        <Link href="/sign-in?redirect_url=%2Fm%2Fcreate">
                          <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                            Create Your Own
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
            Ready to scan your own projects?
          </h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Sign in to use ScopeScan on your real job site photos. 
            Generate professional proposals in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="demo-bottom-signin">
              <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                <Camera className="w-5 h-5 mr-2" />
                Start ScopeScan
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/scopescan">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More About ScopeScan
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
