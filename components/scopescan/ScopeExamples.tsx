"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

/**
 * ScopeExamples - Displays real project examples analyzed by ScopeScan
 * Used on the ScopeScan marketing landing page
 */
export function ScopeExamples() {
  const exampleProjects = [
    {
      src: "/images/scopescan/projects/bathroom-real.jpg",
      alt: "Bathroom remodel project analyzed by ScopeScan",
      label: "Bathroom Remodel",
      output: "Scope generated: 12 line items",
    },
    {
      src: "/images/scopescan/projects/kitchen-real.jpg",
      alt: "Kitchen renovation project analyzed by ScopeScan",
      label: "Kitchen Renovation",
      output: "Scope generated: 18 line items",
    },
    {
      src: "/images/scopescan/projects/roof-real.jpg",
      alt: "Roof replacement project analyzed by ScopeScan",
      label: "Roof Replacement",
      output: "Scope generated: 9 line items",
    },
  ];

  return (
    <section
      id="examples"
      className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100"
      data-testid="scopescan-proof-section"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-3">
              Real Projects Analyzed by ScopeScan
            </h2>
            <p className="text-slate-600">
              See how ScopeScan transforms job site photos into detailed scopes.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6" data-testid="example-projects-grid">
            {exampleProjects.map((project, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200"
              >
                {/* Photo Thumbnail */}
                <div className="aspect-[4/3] relative bg-slate-100">
                  <Image
                    src={project.src}
                    alt={project.alt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-white text-sm font-medium">{project.label}</p>
                  </div>
                </div>

                {/* Output Preview */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-slate-900">{project.label}</span>
                  </div>
                  <p className="text-sm text-slate-500">{project.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
