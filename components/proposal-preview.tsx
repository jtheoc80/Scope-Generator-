'use client';
import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Clock, Shield, AlertCircle, MapPin, Layers } from "lucide-react";

interface CompanyInfo {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyLogo?: string | null;
  licenseNumber?: string | null;
}

interface LineItem {
  serviceId: string;
  tradeName: string;
  jobTypeName: string;
  scope: string[];
  priceRange: { low: number; high: number };
  estimatedDays: { low: number; high: number };
  warranty?: string;
  exclusions?: string[];
}

interface ProposalPreviewProps {
  data: {
    clientName?: string;
    address?: string;
    jobTypeName?: string;
    scope?: string[];
    priceRange?: { low: number; high: number };
    estimatedDays?: { low: number; high: number };
    warranty?: string;
    exclusions?: string[];
    regionalInfo?: {
      state: string;
      abbrev: string;
      region: string;
      multiplier: number;
    } | null;
    lineItems?: LineItem[];
  };
  blurred?: boolean;
  onUnlock?: () => void;
  companyInfo?: CompanyInfo;
}

const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  ({ data, blurred = true, onUnlock, companyInfo }, ref) => {
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0]; // YYYY-MM-DD format for deterministic hashing
    const todayFormatted = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const proposalNumber = (() => {
      const seed = `${data.clientName ?? ""}|${data.address ?? ""}|${todayISO}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      }
      return String(hash % 10000).padStart(4, "0");
    })();

    const hasMultipleServices = data.lineItems && data.lineItems.length > 1;
    const lineItems = data.lineItems || [];

    return (
      <div ref={ref} className="bg-white shadow-xl min-h-[800px] w-full max-w-[800px] mx-auto p-8 md:p-12 relative text-slate-800 text-sm leading-relaxed font-serif">
        {/* Preview Mode Banner */}
        {blurred && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 px-4 text-xs font-bold uppercase tracking-wide z-10 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Preview Mode – Some content is hidden. Unlock to see full proposal.
          </div>
        )}

        {/* DRAFT Watermark */}
        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <span className="text-[180px] font-bold text-slate-200/40 tracking-wider -rotate-45 select-none whitespace-nowrap">
              DRAFT
            </span>
          </div>
        )}

        {/* Header */}
        <div className={cn("flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8", blurred && "mt-8")}>
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900 uppercase tracking-wide">Proposal</h1>
            <p className="text-slate-500 mt-1">#{proposalNumber}</p>
          </div>
          <div className="text-right flex items-start gap-4 justify-end">
            {companyInfo?.companyLogo && (
              <img 
                src={companyInfo.companyLogo} 
                alt="Company logo" 
                className="w-16 h-16 object-contain"
                data-testid="img-proposal-logo"
              />
            )}
            <div>
              <div className="text-xl font-bold text-slate-900">
                {companyInfo?.companyName || "Your Company Name"}
              </div>
              <div className="text-slate-500 text-xs mt-1 whitespace-pre-line">
                {companyInfo?.companyAddress || "123 Contractor Way\nCityville, ST 12345"}
                {companyInfo?.companyPhone && (
                  <>
                    <br />
                    {companyInfo.companyPhone}
                  </>
                )}
                {companyInfo?.licenseNumber && (
                  <>
                    <br />
                    <span className="text-slate-600">Lic# {companyInfo.licenseNumber}</span>
                  </>
                )}
                {!companyInfo?.companyAddress && !companyInfo?.companyPhone && (
                  <>
                    <br />
                    (555) 123-4567
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prepared For</h3>
            <div className="font-bold text-lg">{data.clientName || "Client Name"}</div>
            <div className="text-slate-600">{data.address || "123 Client Street"}</div>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
            <div>{todayFormatted}</div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-4">
              {hasMultipleServices ? "Proposal Type" : "Job Type"}
            </h3>
            <div className="font-medium">
              {hasMultipleServices ? (
                <span className="flex items-center justify-end gap-1">
                  <Layers className="w-4 h-4" />
                  Multi-Service Proposal
                </span>
              ) : (
                data.jobTypeName || "General Contracting"
              )}
            </div>
          </div>
        </div>

        {/* Timeline Estimate */}
        {data.estimatedDays && (
          <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">Estimated Timeline: </span>
              <span className="text-blue-800">
                {data.estimatedDays.low === data.estimatedDays.high 
                  ? `${data.estimatedDays.low} working day${data.estimatedDays.low > 1 ? 's' : ''}`
                  : `${data.estimatedDays.low}-${data.estimatedDays.high} working days`
                }
              </span>
            </div>
          </div>
        )}

        {/* Multi-Service Line Items Summary */}
        {hasMultipleServices && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">
              <Layers className="w-4 h-4 inline mr-2 -mt-0.5" />
              Services Included
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Service</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-700">Est. Days</th>
                    <th className="text-right py-3 px-4 font-bold text-slate-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.serviceId} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{item.jobTypeName}</div>
                        <div className="text-xs text-slate-500">{item.tradeName}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {item.estimatedDays.low === item.estimatedDays.high
                          ? item.estimatedDays.low
                          : `${item.estimatedDays.low}-${item.estimatedDays.high}`
                        }
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${Math.round((item.priceRange.low + item.priceRange.high) / 2).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/10 border-t-2 border-primary">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Total</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {data.estimatedDays?.low === data.estimatedDays?.high
                        ? data.estimatedDays?.low
                        : `${data.estimatedDays?.low}-${data.estimatedDays?.high}`
                      }
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg text-primary">
                      ${Math.round(((data.priceRange?.low ?? 0) + (data.priceRange?.high ?? 0)) / 2).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Scope of Work - Show by service for multi-service */}
        {hasMultipleServices ? (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">Detailed Scope of Work</h2>
            
            <div className="space-y-6">
              <p className="italic text-slate-600">
                We propose to furnish all materials and perform all labor necessary to complete the following:
              </p>

              {lineItems.map((item, serviceIndex) => (
                <div key={item.serviceId} className="border-l-4 border-l-secondary pl-4">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-secondary text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {serviceIndex + 1}
                    </span>
                    {item.jobTypeName}
                    <span className="text-slate-500 font-normal text-sm">({item.tradeName})</span>
                  </h3>

                  {/* First 4 items shown */}
                  <ul className="list-disc pl-5 space-y-2 marker:text-secondary mb-2">
                    {item.scope.slice(0, 4).map((scopeItem, i) => (
                      <li key={i}>{scopeItem}</li>
                    ))}
                  </ul>

                  {/* BLURRED SECTION for remaining items */}
                  {item.scope.length > 4 && (
                    <div className="relative mt-2">
                      {blurred && serviceIndex === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded">
                          <p className="text-slate-900 font-bold mb-2">Detailed scope & pricing hidden</p>
                          <button 
                            onClick={onUnlock}
                            className="bg-secondary text-slate-900 px-4 py-2 rounded font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                          >
                            Unlock Full Proposal
                          </button>
                        </div>
                      )}
                      
                      <div className={cn("space-y-2", blurred && "opacity-30 select-none filter blur-[1px]")}>
                        <ul className="list-disc pl-5 space-y-2 marker:text-secondary">
                          {item.scope.slice(4).map((scopeItem, i) => (
                            <li key={i}>{scopeItem}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Single Service Scope of Work */
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">Scope of Work</h2>
            
            <div className="space-y-4">
              <p className="italic text-slate-600">
                We propose to furnish all materials and perform all labor necessary to complete the following:
              </p>

              <ul className="list-disc pl-5 space-y-2 marker:text-secondary">
                {data.scope && data.scope.length > 0 ? (
                  data.scope.slice(0, 4).map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))
                ) : (
                  <>
                    <li>Consultation and site preparation.</li>
                    <li>Demolition of existing structures as required.</li>
                    <li>Installation of new materials per manufacturer specifications.</li>
                  </>
                )}
              </ul>

              {/* BLURRED SECTION */}
              <div className="relative mt-2">
                {blurred && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded">
                    <p className="text-slate-900 font-bold mb-2">Detailed scope & pricing hidden</p>
                    <button 
                      onClick={onUnlock}
                      className="bg-secondary text-slate-900 px-4 py-2 rounded font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                    >
                      Unlock Full Proposal
                    </button>
                  </div>
                )}
                
                <div className={cn("space-y-4", blurred && "opacity-30 select-none filter blur-[1px]")}>
                  <ul className="list-disc pl-5 space-y-2 marker:text-secondary">
                    {data.scope && data.scope.length > 4 ? (
                      data.scope.slice(4).map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <>
                        <li>Detailed plumbing rough-in and trim-out specifications.</li>
                        <li>Electrical fixture installation and safety checks.</li>
                        <li>Final site cleanup and debris removal.</li>
                        <li>Walkthrough and final inspection with homeowner.</li>
                        <li>Warranty documentation handover.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exclusions Section */}
        {data.exclusions && data.exclusions.length > 0 && (
          <div className={cn("mb-8", blurred && "opacity-30 blur-[1px]")}>
            <h2 className="text-lg font-heading font-bold text-white bg-amber-600 px-3 py-1 inline-block mb-4">
              <AlertCircle className="w-4 h-4 inline mr-2 -mt-0.5" />
              Not Included
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 mb-3">The following items are not included in this proposal and may require separate pricing:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-amber-800">
                {data.exclusions.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Regional Pricing Info */}
        {data.regionalInfo && (
          <div className="mb-6 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
            <MapPin className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <span className="font-bold text-purple-900">Regional Pricing: </span>
              <span className="text-purple-800">
                {data.regionalInfo.state} ({data.regionalInfo.region})
                {data.regionalInfo.multiplier !== 1 && (
                  <span className={cn(
                    "ml-2 font-medium",
                    data.regionalInfo.multiplier > 1 ? "text-orange-600" : "text-green-600"
                  )}>
                    {data.regionalInfo.multiplier > 1 ? "+" : ""}{Math.round((data.regionalInfo.multiplier - 1) * 100)}% adjustment
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Pricing - Only show for single service (multi-service shows in table) */}
        {!hasMultipleServices && (
          <div className="mb-8 break-inside-avoid">
            <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">Investment</h2>
            
            <div className={cn("border border-slate-200 rounded-lg p-6 bg-slate-50", blurred && "opacity-30 blur-[2px]")}>
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-slate-700">Total Project Estimate</span>
                <span className="text-2xl font-bold text-slate-900">
                  ${Math.round(((data.priceRange?.low ?? 0) + (data.priceRange?.high ?? 0)) / 2).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                *Price includes all labor, materials, and taxes as specified above. Valid for 30 days.
                {data.regionalInfo && data.regionalInfo.multiplier !== 1 && (
                  <> Pricing adjusted for {data.regionalInfo.state} market rates.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Warranty Section */}
        {data.warranty && (
          <div className={cn("mb-8", blurred && "opacity-30 blur-[1px]")}>
            <h2 className="text-lg font-heading font-bold text-white bg-green-700 px-3 py-1 inline-block mb-4">
              <Shield className="w-4 h-4 inline mr-2 -mt-0.5" />
              Warranty
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{data.warranty}</p>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className={cn("mb-8 text-xs text-slate-500", blurred && "opacity-30 blur-[1px]")}>
          <h3 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Terms & Conditions</h3>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Payment terms: 50% deposit due upon acceptance, balance due upon completion.</li>
            <li>Any changes to the scope of work may result in additional charges.</li>
            <li>Work schedule subject to weather conditions and material availability.</li>
            <li>Customer to provide access to work area and utilities as needed.</li>
            <li>All permits to be obtained by contractor unless otherwise specified.</li>
          </ol>
        </div>

        {/* Footer/Signature */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
          <div>
            <div className="h-12 border-b border-slate-900 mb-2"></div>
            <div className="text-xs font-bold uppercase text-slate-500">Contractor Signature</div>
          </div>
          <div>
            <div className="h-12 border-b border-slate-900 mb-2"></div>
            <div className="text-xs font-bold uppercase text-slate-500">Client Signature</div>
          </div>
        </div>

        {/* Acceptance Date */}
        <div className="mt-6 text-center text-xs text-slate-400">
          This proposal is valid for 30 days from the date above.
        </div>

        {/* Powered by ScopeGen Footer */}
        <div 
          data-testid="footer-powered-by"
          className="mt-8 pt-6 border-t border-slate-100 text-center"
        >
          <Link 
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Powered by <span className="font-semibold">ScopeGen</span>
          </Link>
          <p className="text-[10px] text-slate-300 mt-1">
            Professional proposals in seconds
          </p>
        </div>
      </div>
    );
  }
);

ProposalPreview.displayName = "ProposalPreview";
export default ProposalPreview;
