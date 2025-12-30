"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";

type ScopeGroup = {
  title: string;
  items: string[];
};

type ScopeExample = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  groups: ScopeGroup[];
};

const examples: ScopeExample[] = [
  {
    title: "Bathroom Remodel",
    subtitle: "Sample Scope",
    imageSrc: "/images/scopescan/examples/bathroom-before.jpg",
    imageAlt: "Dated bathroom before remodel with fixtures and tile",
    groups: [
      {
        title: "Demo & Prep",
        items: [
          "Protect floors and set dust containment",
          "Remove vanity, toilet, and old fixtures",
          "Demo tile surround and backer as needed",
        ],
      },
      {
        title: "Install & Build",
        items: [
          "Install cement board + waterproofing system",
          "Set new tub/shower valve and plumbing trim",
          "Install tile with grout and silicone joints",
        ],
      },
      {
        title: "Finish & Warranty",
        items: ["Final punch list and cleanup", "Warranty + care instructions"],
      },
    ],
  },
  {
    title: "Roof Replacement",
    subtitle: "Sample Scope",
    imageSrc: "/images/scopescan/examples/roof-before.jpg",
    imageAlt: "Worn asphalt shingle roof before replacement",
    groups: [
      {
        title: "Demo & Prep",
        items: [
          "Protect landscaping and set up debris zones",
          "Tear off existing shingles to decking",
          "Inspect decking and note replacement areas",
        ],
      },
      {
        title: "Install & Build",
        items: [
          "Install underlayment + ice & water at eaves",
          "Replace flashings at valleys/walls as needed",
          "Install architectural shingles + ridge vent",
        ],
      },
      {
        title: "Finish & Warranty",
        items: ["Magnetic nail sweep + haul away", "Labor warranty + manufacturer docs"],
      },
    ],
  },
];

function OutcomeChips() {
  const chips = ["Clear line items", "Materials listed", "Total price + options"];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function ScopeExamples() {
  return (
    <section
      id="examples"
      className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100"
      data-testid="scopescan-scope-examples"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-3">
              Real scope-of-work examples your customers will see
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Show homeowners a clean, professional scope they can approve before you leave.
              <br />
              <span className="text-slate-500">
                Short preview below—your full proposal includes pricing, materials, and options.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examples.map((example) => (
              <div
                key={example.title}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="relative aspect-[16/9] bg-slate-100">
                  <Image
                    src={example.imageSrc}
                    alt={example.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 520px, 100vw"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-white">
                      <div className="text-base sm:text-lg font-semibold">
                        {example.title} — {example.subtitle}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="divide-y divide-slate-200">
                    {example.groups.map((group) => (
                      <div key={group.title} className="py-4 first:pt-0 last:pb-0">
                        <div className="text-slate-700 text-sm font-semibold uppercase tracking-wide">
                          {group.title}
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {group.items.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 flex-none rounded-full bg-slate-300" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <div className="text-slate-700 text-sm font-semibold uppercase tracking-wide mb-2">
                      What the homeowner sees
                    </div>
                    <OutcomeChips />
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/scopescan/demo"
                      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-700"
                    >
                      <FileText className="h-4 w-4" />
                      View full sample PDF
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

