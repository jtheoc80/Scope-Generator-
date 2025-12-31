"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function ProposalThumbnail({
  url,
  count,
  title,
  href,
  className,
}: {
  url?: string | null;
  count?: number | null;
  title?: string | null;
  href: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const alt = useMemo(() => {
    const safeTitle = (title ?? "").trim();
    return safeTitle.length > 0 ? `${safeTitle} photo preview` : "Proposal photo preview";
  }, [title]);

  if (!url || failed) return null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-lg border border-slate-200 bg-slate-100",
        className,
      )}
      aria-label="View proposal"
      title="View proposal"
    >
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(min-width: 768px) 44px, 36px"
        className="object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      {(count ?? 0) > 1 ? (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          +{Math.max(0, (count ?? 0) - 1)}
        </span>
      ) : null}
    </Link>
  );
}

