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
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>`
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
      aria-labelledby="scopescan-heading"
      className="border-y border-slate-200 bg-slate-50 py-14 sm:py-18"
      data-testid="section-scopescan-teaser"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div className="order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                ScopeScan
              </div>

              <h2
                id="scopescan-heading"
                className="mt-4 text-3xl font-heading font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Quote before you leave the job site.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Snap a few photos. ScopeScan turns them into a professional scope + pricing—so
                you can send the quote while the homeowner is still with you.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-700 sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Close on-site with a ready-to-send quote</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Move leads into your pipeline faster (same visit)</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Check className="h-4 w-4 text-slate-700" />
                  </span>
                  <span>Clean, professional scope your customer can understand</span>
                </li>
              </ul>

              <p className="mt-5 text-sm text-slate-500">
                Built for speed: minimal typing, mobile-first workflow.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/scopescan" data-testid="scopescan-cta-primary">
                    Try ScopeScan
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
                  <div className="grid gap-3 sm:gap-4">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <SafeImage
                          src="/images/scopescan/hero.jpg"
                          alt="Contractor discussing an estimate with a homeowner on-site"
                          sizes="(max-width: 1024px) 100vw, 560px"
                          priority
                        />
                      </div>

                      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/25 bg-black/35 px-3 py-2 text-xs font-medium text-white backdrop-blur">
                        Same-visit quoting
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <PhotoTile
                        src="/images/scopescan/bathroom.jpg"
                        alt="Bathroom remodel photo"
                        label="Bathroom Remodel"
                      />
                      <PhotoTile
                        src="/images/scopescan/kitchen.jpg"
                        alt="Kitchen renovation photo"
                        label="Kitchen Reno"
                      />
                      <PhotoTile
                        src="/images/scopescan/roof.jpg"
                        alt="Roof replacement photo"
                        label="Roof Replacement"
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
                  <div className="text-sm font-semibold text-slate-900">Snap photos</div>
                  <div className="text-sm text-slate-600">Walk the space, capture key angles.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-900">AI</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">AI builds scope + price</div>
                  <div className="text-sm text-slate-600">Clear line items in minutes.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <Check className="h-4 w-4 text-slate-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Send quote &amp; win job</div>
                  <div className="text-sm text-slate-600">Close while you’re still on-site.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

