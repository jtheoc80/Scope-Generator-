"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Camera, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const blurSvg = (w: number, h: number) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#ffffffff"/></svg>`
  ).toString("base64")}`;

function SafeImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = React.useState(false);

  if (errored) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-full w-full bg-gradient-to-br from-slate-100 to-slate-200",
          className
        )}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={90}
      placeholder="blur"
      blurDataURL={blurSvg(48, 32)}
      className={cn("object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
}

function PhotoTile({
  src,
  label,
  alt,
  className,
}: {
  src: string;
  label: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="relative aspect-[4/3]">
        <SafeImage
          src={src}
          alt={alt}
          sizes="(max-width: 1024px) 33vw, 220px"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="bg-gradient-to-t from-black/55 to-transparent px-3 py-2">
          <span className="inline-flex items-center rounded-md bg-black/35 px-2 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScopeScanTeaser() {
  return (
    <section
      aria-labelledby="scopescan-teaser-heading"
      className="border-y border-slate-200 bg-slate-50 py-14 sm:py-18"
      data-testid="section-scopescan-teaser"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div className="order-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  <Camera className="h-3.5 w-3.5 text-slate-500" />
                  ScopeScan
                </div>
                <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm">
                  Close more deals
                </div>
              </div>

              <h2
                id="scopescan-teaser-heading"
                className="mt-4 text-3xl font-heading font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Close more deals with same-visit quotes.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Turn job site photos into a professional scope + pricing in minutes—so you can
                send the quote immediately and win before competitors respond.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-700 sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Win while homeowner intent is highest (same visit)</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Beat slow vendor/sub/office follow-ups</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Send a clean scope customers understand</span>
                </li>
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/scopescan" data-testid="scopescan-cta-primary">
                    Close More Deals
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/scopescan#examples" data-testid="scopescan-cta-secondary">
                    See Examples
                  </Link>
                </Button>
              </div>
            </div>

            {/* Images */}
            <div className="order-2">
              <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
                <div className="p-3 sm:p-4">
                  <div className="grid gap-3 sm:gap-4" data-testid="scopescan-teaser-images">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <SafeImage
                          src="/images/scopescan/hero/hero-exterior.jpg"
                          alt="Roof repair crew working on a house exterior"
                          sizes="(max-width: 1024px) 100vw, 560px"
                          priority
                        />
                      </div>

                      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/25 bg-black/35 px-3 py-2 text-xs font-medium text-white backdrop-blur">
                        Same-visit quotes
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <PhotoTile
                        src="/images/scopescan/hero/tile-bathroom.jpg"
                        alt="Dated bathroom vanity before remodel"
                        label="Bathroom Remodel"
                      />
                      <PhotoTile
                        src="/images/scopescan/hero/tile-kitchen.jpg"
                        alt="Kitchen during demolition phase"
                        label="Kitchen Reno"
                      />
                      <PhotoTile
                        src="/images/scopescan/hero/tile-exterior.jpg"
                        alt="House exterior siding damage needing repair"
                        label="Exterior Repair"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Compact 3-step row */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <Camera className="h-4 w-4 text-slate-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Capture the job</div>
                  <div className="text-sm text-slate-600">Walk the space, capture key angles.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-900">AI</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Generate the quote</div>
                  <div className="text-sm text-slate-600">Clear line items in minutes.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <Check className="h-4 w-4 text-slate-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Win the deal</div>
                  <div className="text-sm text-slate-600">Send immediately while intent is highest.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

