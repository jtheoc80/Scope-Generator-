'use client';
import { forwardRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Shield, AlertCircle, Layers, CheckCircle2, FileQuestion, Plus } from "lucide-react";
import { 
  HeroPhoto, 
  ExistingConditionsGrid, 
  ScopePhotoInline, 
  AppendixGallery,
  organizePhotosForProposal,
  type ProposalPhoto,
} from "@/components/proposal-photos";

interface CompanyInfo {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyLogo?: string | null;
  licenseNumber?: string | null;
}

/**
 * A section within the scope of work (for grouped display)
 */
interface ScopeSection {
  title: string;
  items: string[];
}

interface LineItem {
  serviceId: string;
  tradeName: string;
  jobTypeName: string;
  scope: string[];
  /** Optional: Grouped scope sections with headings */
  scopeSections?: ScopeSection[];
  /** Optional: Items that are explicitly included */
  included?: string[];
  /** Optional: Assumptions made for this scope */
  assumptions?: string[];
  /** Optional: Add-on items */
  addons?: string[];
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
    /** Optional: Grouped scope sections with headings (preferred over scope for display) */
    scopeSections?: ScopeSection[];
    /** Optional: Items that are explicitly included */
    included?: string[];
    /** Optional: Assumptions made for this scope */
    assumptions?: string[];
    /** Optional: Add-on items */
    addons?: string[];
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
  /** Photos to display in the proposal */
  photos?: ProposalPhoto[];
  /** Whether to show photos in the proposal (default: true if photos provided) */
  showPhotos?: boolean;
}

const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  ({ data, companyInfo, photos = [], showPhotos = true }, ref) => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const proposalNumber = (() => {
      const seed = `${data.clientName ?? ""}|${data.address ?? ""}|${today}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      }
      return String(hash % 10000).padStart(4, "0");
    })();

    const hasMultipleServices = data.lineItems && data.lineItems.length > 1;
    // Memoize lineItems to prevent useMemo dependency issues
    const lineItems = useMemo(() => data.lineItems || [], [data.lineItems]);

    // Organize photos for display
    const organizedPhotos = useMemo(() => {
      const allScopeItems = hasMultipleServices 
        ? lineItems.flatMap(item => item.scope)
        : (data.scope || []);
      return organizePhotosForProposal(photos, allScopeItems);
    }, [photos, hasMultipleServices, lineItems, data.scope]);
    
    const hasPhotos = showPhotos && photos.length > 0;

    return (
      <div ref={ref} className="bg-white shadow-xl min-h-[800px] w-full max-w-[800px] mx-auto p-8 md:p-12 relative text-slate-800 text-sm leading-relaxed font-serif">

        {/* Hero Photo Banner (if available) */}
        {hasPhotos && organizedPhotos.hero && (
          <div className="mb-6">
            <HeroPhoto
              photo={organizedPhotos.hero}
              companyLogo={companyInfo?.companyLogo}
              companyName={companyInfo?.companyName || "Your Company Name"}
              customerName={data.clientName}
              address={data.address}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900 uppercase tracking-wide">Proposal</h1>
            <p className="text-slate-500 mt-1">#{proposalNumber}</p>
          </div>
          <div className="text-right flex items-start gap-4 justify-end">
            {/* Only show logo here if no hero photo (logo already in hero) */}
            {companyInfo?.companyLogo && !organizedPhotos.hero && (
              <Image 
                src={companyInfo.companyLogo} 
                alt="Company logo" 
                width={64}
                height={64}
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
            <div className="font-bold text-lg" data-testid="preview-client-name">{data.clientName || "Client Name"}</div>
            <div className="text-slate-600" data-testid="preview-address">{data.address || "123 Client Street"}</div>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
            <div>{today}</div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-4">
              {hasMultipleServices ? "Proposal Type" : "Job Type"}
            </h3>
            <div className="font-medium" data-testid="preview-job-type">
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

        {/* Existing Conditions Photos (2-6 photos in grid) */}
        {hasPhotos && organizedPhotos.existingConditions.length > 0 && (
          <ExistingConditionsGrid 
            photos={organizedPhotos.existingConditions}
            maxPhotos={6}
          />
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

              {lineItems.map((item, serviceIndex) => {
                // Find photos matching this service's scope items
                const servicePhotos = item.scope.flatMap(scopeItem => 
                  organizedPhotos.scopePhotos[scopeItem] || []
                ).slice(0, 2); // Max 2 photos per service section
                
                return (
                  <div key={item.serviceId} className="border-l-4 border-l-secondary pl-4">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="bg-secondary text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {serviceIndex + 1}
                      </span>
                      {item.jobTypeName}
                      <span className="text-slate-500 font-normal text-sm">({item.tradeName})</span>
                    </h3>

                    {/* Inline scope photos for this service */}
                    {hasPhotos && servicePhotos.length > 0 && (
                      <ScopePhotoInline 
                        photos={servicePhotos} 
                        variant={servicePhotos.length > 1 ? 'pair' : 'single'}
                      />
                    )}

                    {/* All scope items shown */}
                    <ul className="list-disc pl-5 space-y-2 marker:text-secondary">
                      {item.scope.map((scopeItem, i) => (
                        <li key={i}>{scopeItem}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
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

              {/* Inline scope photos for single service (show first matching photos) */}
              {hasPhotos && (() => {
                const singleServicePhotos = Object.values(organizedPhotos.scopePhotos).flat().slice(0, 2);
                return singleServicePhotos.length > 0 ? (
                  <ScopePhotoInline 
                    photos={singleServicePhotos} 
                    variant={singleServicePhotos.length > 1 ? 'pair' : 'single'}
                  />
                ) : null;
              })()}

              {/* New: Render grouped sections if scopeSections is present */}
              {data.scopeSections && data.scopeSections.length > 0 ? (
                <div className="space-y-6" data-testid="preview-scope-sections">
                  {data.scopeSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="scope-section">
                      <h3 
                        className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 border-b border-slate-200 pb-1"
                        data-testid={`preview-scope-section-heading-${sectionIndex}`}
                      >
                        {section.title}
                      </h3>
                      <ul className="list-disc pl-5 space-y-1.5 marker:text-secondary" data-testid={`preview-scope-section-items-${sectionIndex}`}>
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} data-testid={`preview-scope-item-${sectionIndex}-${itemIndex}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                /* Legacy: Render flat scope array */
                <ul className="list-disc pl-5 space-y-2 marker:text-secondary" data-testid="preview-scope-list">
                  {data.scope && data.scope.length > 0 ? (
                    data.scope.map((item: string, i: number) => (
                      <li key={i} data-testid={`preview-scope-item-${i}`}>{item}</li>
                    ))
                  ) : (
                    <>
                      <li>Consultation and site preparation.</li>
                      <li>Demolition of existing structures as required.</li>
                      <li>Installation of new materials per manufacturer specifications.</li>
                      <li>Detailed plumbing rough-in and trim-out specifications.</li>
                      <li>Electrical fixture installation and safety checks.</li>
                      <li>Final site cleanup and debris removal.</li>
                      <li>Walkthrough and final inspection with homeowner.</li>
                      <li>Warranty documentation handover.</li>
                    </>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Included Section (if present) */}
        {data.included && data.included.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-green-700 px-3 py-1 inline-block mb-4">
              <CheckCircle2 className="w-4 h-4 inline mr-2 -mt-0.5" />
              Included
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ul className="list-disc pl-5 space-y-1.5 text-green-800" data-testid="preview-included-list">
                {data.included.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Assumptions Section (if present) */}
        {data.assumptions && data.assumptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-blue-600 px-3 py-1 inline-block mb-4">
              <FileQuestion className="w-4 h-4 inline mr-2 -mt-0.5" />
              Assumptions
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-3">This proposal is based on the following assumptions:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-blue-800" data-testid="preview-assumptions-list">
                {data.assumptions.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Add-ons Section (if present) */}
        {data.addons && data.addons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white bg-purple-600 px-3 py-1 inline-block mb-4">
              <Plus className="w-4 h-4 inline mr-2 -mt-0.5" />
              Available Add-ons
            </h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900 mb-3">Optional upgrades available upon request:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-purple-800" data-testid="preview-addons-list">
                {data.addons.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Exclusions Section */}
        {data.exclusions && data.exclusions.length > 0 && (
          <div className="mb-8">
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

        {/* Pricing - Only show for single service (multi-service shows in table) */}
        {!hasMultipleServices && (
          <div className="mb-8 break-inside-avoid">
            <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">Investment</h2>
            
            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-slate-700">Total Project Estimate</span>
                <span className="text-2xl font-bold text-slate-900" data-testid="preview-total-price">
                  ${Math.round(((data.priceRange?.low ?? 0) + (data.priceRange?.high ?? 0)) / 2).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                *Price includes all labor, materials, and taxes as specified above. Valid for 30 days.
              </p>
            </div>
          </div>
        )}

        {/* Warranty Section */}
        {data.warranty && (
          <div className="mb-8">
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
        <div className="mb-8 text-xs text-slate-500">
          <h3 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Terms & Conditions</h3>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Payment terms: 50% deposit due upon acceptance, balance due upon completion.</li>
            <li>Any changes to the scope of work may result in additional charges.</li>
            <li>Work schedule subject to weather conditions and material availability.</li>
            <li>Customer to provide access to work area and utilities as needed.</li>
            <li>All permits to be obtained by contractor unless otherwise specified.</li>
          </ol>
        </div>

        {/* Photo Appendix Gallery (all remaining photos) */}
        {hasPhotos && organizedPhotos.appendix.length > 0 && (
          <AppendixGallery 
            photos={organizedPhotos.appendix}
            title="Photo Appendix"
          />
        )}

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
