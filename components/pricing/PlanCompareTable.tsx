import Link from "next/link";
import { Fragment } from "react";
import { Check, Minus } from "lucide-react";

type PlanKey = "starter" | "pro" | "crew";

type CompareTableProps = {
  // Using `any` to match existing `t` usage in `app/page.tsx`
  // and avoid widening translation typings across the repo.
  t: any;
};

type Cell =
  | { kind: "text"; value: string }
  | { kind: "bool"; included: boolean };

type FeatureRow = {
  id: string;
  label: string;
  description?: string;
  values: Record<PlanKey, Cell>;
  testId?: string;
};

type FeatureGroup = {
  label: string;
  rows: FeatureRow[];
};

function CellContent({ cell, t }: { cell: Cell; t: any }) {
  if (cell.kind === "bool") {
    const included = cell.included;
    const srText = included ? t.home.included : t.home.notIncluded; // keeps "✓" / "—" in DOM for existing tests

    return (
      <span className="inline-flex items-center justify-center">
        <span className="sr-only">{srText}</span>
        {included ? (
          <Check
            aria-hidden="true"
            className="h-5 w-5 text-emerald-600"
            strokeWidth={2.5}
          />
        ) : (
          <Minus
            aria-hidden="true"
            className="h-5 w-5 text-slate-300"
            strokeWidth={2.5}
          />
        )}
      </span>
    );
  }

  return (
    <span className="text-slate-700 font-medium">
      {cell.value}
    </span>
  );
}

export function PlanCompareTable({ t }: CompareTableProps) {
  const plans: Array<{
    key: PlanKey;
    name: string;
    tagline: string;
    price: string;
    recommended?: boolean;
    microcopy?: string;
  }> = [
    {
      key: "starter",
      name: t.home.starterPlan,
      tagline: "Pay as you go",
      price: `${t.home.starterPrice} ${t.home.starterPriceLabel}`, // "$9 per proposal"
    },
    {
      key: "pro",
      name: t.home.proPlan,
      tagline: "Best for solo operators",
      price: `${t.home.proPrice}${t.home.proPriceLabel}`, // "$29/month"
      recommended: true,
      microcopy: "Most popular",
    },
    {
      key: "crew",
      name: t.home.crewPlan,
      tagline: "Built for teams",
      price: `${t.home.crewPrice}${t.home.crewPriceLabel}`, // "$79/month"
    },
  ];

  const groups: FeatureGroup[] = [
    {
      label: "Core",
      rows: [
        {
          id: "proposals",
          label: t.home.featureProposals,
          values: {
            starter: { kind: "text", value: t.home.starterFeature1 }, // "Pay per proposal"
            pro: { kind: "text", value: t.home.proFeature1 }, // "15 proposals/month"
            crew: { kind: "text", value: t.home.crewFeature1 }, // "50 proposals/month"
          },
        },
        {
          id: "templates",
          label: t.home.featureTemplates,
          values: {
            starter: { kind: "bool", included: true },
            pro: { kind: "bool", included: true },
            crew: { kind: "bool", included: true },
          },
        },
        {
          id: "pdf",
          label: t.home.featurePdfDownload,
          values: {
            starter: { kind: "bool", included: true },
            pro: { kind: "bool", included: true },
            crew: { kind: "bool", included: true },
          },
        },
      ],
    },
    {
      label: "Sales & Close",
      rows: [
        {
          id: "esignature",
          label: t.home.featureEsignature,
          values: {
            starter: { kind: "bool", included: false },
            pro: { kind: "bool", included: true },
            crew: { kind: "bool", included: true },
          },
          testId: "compare-row-esignature",
        },
        {
          id: "branding",
          label: t.home.featureBranding,
          values: {
            starter: { kind: "text", value: t.home.scopegenBranding },
            pro: { kind: "text", value: t.home.customLogo },
            crew: { kind: "text", value: t.home.fullCustomBranding },
          },
        },
      ],
    },
    {
      label: "Team & Support",
      rows: [
        {
          id: "seats",
          label: t.home.featureSeats,
          values: {
            starter: { kind: "text", value: "1" },
            pro: { kind: "text", value: "1" },
            crew: { kind: "text", value: "3" },
          },
        },
        {
          id: "support",
          label: t.home.featureSupport,
          values: {
            starter: { kind: "text", value: t.home.emailSupport },
            pro: { kind: "text", value: t.home.priorityEmail },
            crew: { kind: "text", value: t.home.priorityPhoneEmail },
          },
        },
      ],
    },
    {
      label: "Insights",
      rows: [
        {
          id: "marketPricing",
          label: t.home.featureMarketPricing,
          values: {
            starter: { kind: "bool", included: false },
            pro: { kind: "bool", included: true },
            crew: { kind: "bool", included: true },
          },
        },
      ],
    },
  ];

  const headerCellBase =
    "px-4 py-5 align-bottom border-b border-slate-200 bg-white";
  const bodyCellBase =
    "px-4 py-5 align-middle border-b border-slate-200/70 text-sm sm:text-[15px]";

  const proColFrame = "border-l border-r border-orange-200/60";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-slate-900">
              {t.home.comparePlans}
            </h3>
            <p className="text-sm text-slate-600">
              {t.home.comparePlansSubtitle}
            </p>
          </div>
          <Link
            href="mailto:support@scopegenerator.com"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            Need help choosing?
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[920px] text-left"
          data-testid="compare-plans-table"
        >
          <caption className="sr-only">
            {t.home.comparePlans}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={[
                  headerCellBase,
                  "sticky left-0 z-30 min-w-[240px] bg-white",
                  "text-sm font-semibold text-slate-900",
                  "border-r border-slate-200",
                ].join(" ")}
              >
                Feature
              </th>
              {plans.map((plan) => {
                const isPro = plan.key === "pro";
                return (
                  <th
                    key={plan.key}
                    scope="col"
                    className={[
                      headerCellBase,
                      "min-w-[220px] text-center",
                      isPro ? "bg-orange-50/60" : "bg-white",
                      isPro ? proColFrame : "",
                    ].join(" ")}
                  >
                    <div className="inline-flex w-full flex-col items-center gap-1">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-base font-semibold text-slate-900">
                          {plan.name}
                        </span>
                        {plan.recommended ? (
                          <span className="rounded-full bg-orange-500/10 text-orange-700 border border-orange-200 px-2 py-0.5 text-xs font-semibold">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {plan.tagline}
                      </div>
                      <div className="pt-1">
                        <div className="text-2xl font-heading font-bold text-slate-900">
                          {plan.price}
                        </div>
                        {plan.microcopy ? (
                          <div className="text-xs font-medium text-orange-700">
                            {plan.microcopy}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <Fragment key={group.label}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={4}
                    className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    {group.label}
                  </th>
                </tr>

                {group.rows.map((row, idx) => {
                  const zebra = idx % 2 === 1;
                  const rowBg = zebra ? "bg-slate-50/40" : "bg-white";

                  return (
                    <tr
                      key={row.id}
                      data-testid={row.testId}
                      className={[
                        rowBg,
                        "transition-colors",
                        "hover:bg-slate-100/60",
                      ].join(" ")}
                    >
                      <td
                        role="rowheader"
                        className={[
                          bodyCellBase,
                          "sticky left-0 z-20 min-w-[240px] bg-white",
                          "border-r border-slate-200",
                          "text-slate-900 font-semibold",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span>{row.label}</span>
                          {row.description ? (
                            <span className="text-xs font-normal text-slate-500">
                              {row.description}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {plans.map((plan) => {
                        const isPro = plan.key === "pro";
                        return (
                          <td
                            key={`${row.id}-${plan.key}`}
                            className={[
                              bodyCellBase,
                              "text-center",
                              isPro ? proColFrame : "",
                              isPro ? "bg-orange-50/40" : "",
                            ].join(" ")}
                          >
                            <CellContent cell={row.values[plan.key]} t={t} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

