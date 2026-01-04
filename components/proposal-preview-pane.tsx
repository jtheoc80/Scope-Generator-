'use client';

import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import ProposalPreview from '@/components/proposal-preview';
import { type ProposalPhoto } from '@/components/proposal-photos';
import { Eye, EyeOff, X, FileText, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium loading skeleton for the proposal preview
 * Mimics the structure of the actual proposal for smooth transitions
 */
function ProposalSkeleton() {
  return (
    <div className="bg-white shadow-xl min-h-[600px] w-full max-w-[800px] mx-auto p-8 md:p-12 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
        <div>
          <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-16 bg-slate-100 rounded" />
        </div>
        <div className="text-right">
          <div className="h-6 w-40 bg-slate-200 rounded mb-2 ml-auto" />
          <div className="h-3 w-32 bg-slate-100 rounded ml-auto" />
        </div>
      </div>

      {/* Client info skeleton */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
          <div className="h-5 w-28 bg-slate-200 rounded mb-1" />
          <div className="h-4 w-36 bg-slate-100 rounded" />
        </div>
        <div className="text-right">
          <div className="h-3 w-12 bg-slate-100 rounded mb-2 ml-auto" />
          <div className="h-4 w-24 bg-slate-200 rounded ml-auto" />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="mb-6 h-12 bg-blue-50 border border-blue-100 rounded-lg" />

      {/* Scope section skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 bg-slate-800 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-5/6 bg-slate-100 rounded" />
          <div className="h-4 w-4/5 bg-slate-100 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Pricing skeleton */}
      <div className="mb-8">
        <div className="h-6 w-24 bg-slate-800 rounded mb-4" />
        <div className="border border-slate-100 rounded-lg p-6 bg-slate-50">
          <div className="flex justify-between items-end mb-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-300 rounded" />
          </div>
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

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

export interface ProposalPreviewData {
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
  photos?: ProposalPhoto[];
}

interface ProposalPreviewPaneProps {
  /** Proposal data to display in preview */
  data: ProposalPreviewData;
  /** Company info for header */
  companyInfo?: CompanyInfo;
  /** Photos to display in the proposal */
  photos?: ProposalPhoto[];
  /** Whether to show photos in the proposal */
  showPhotos?: boolean;
  /** Whether the preview pane is visible (for desktop sticky panel) */
  visible?: boolean;
  /** Label for mobile drawer toggle */
  drawerLabel?: string;
  /** Whether form has valid services to preview */
  hasValidServices?: boolean;
  /** Whether the preview is loading/generating */
  isLoading?: boolean;
  /** Placeholder text when no services */
  emptyStateTitle?: string;
  /** Placeholder description when no services */
  emptyStateDescription?: string;
  /** Additional class name for the container */
  className?: string;
}

export interface ProposalPreviewPaneHandle {
  /** Reference to the preview div for PDF generation */
  previewRef: React.RefObject<HTMLDivElement | null>;
  /** Open the mobile drawer */
  openDrawer: () => void;
  /** Close the mobile drawer */
  closeDrawer: () => void;
}

/**
 * ProposalPreviewPane - Proposal preview container used in generator layouts.
 *
 * Mobile: Renders a bottom drawer that can be opened/closed.
 * Desktop: Rendering and sticky positioning are controlled by the parent
 *          (e.g. via layout wrappers, `className`, and the `visible` prop).
 *
 * This component itself does not implement desktop sticky behavior; it focuses
 * on rendering the proposal preview content and mobile drawer UI, using
 * placeholders for empty client/address fields.
 */
const ProposalPreviewPane = forwardRef<ProposalPreviewPaneHandle, ProposalPreviewPaneProps>(
  (
    {
      data,
      companyInfo,
      photos = [],
      showPhotos = false,
      visible = true,
      drawerLabel = 'Preview Proposal',
      hasValidServices = false,
      isLoading = false,
      emptyStateTitle = 'Ready to Start',
      emptyStateDescription = 'Fill in the form details to see a live preview of your proposal.',
      className,
    },
    ref
  ) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // Expose ref handle for parent components
    useImperativeHandle(
      ref,
      () => ({
        previewRef,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }),
      []
    );

    // Memoize preview data with placeholders for empty fields
    // These placeholders match what the preview component expects for testing
    const previewDataWithPlaceholders = useMemo(() => {
      return {
        ...data,
        clientName: data.clientName?.trim() || 'Client Name',
        address: data.address?.trim() || '123 Client Street',
      };
    }, [data]);

    // Empty state component - Premium design with helpful guidance
    const EmptyState = useCallback(
      () => (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white p-8 text-center">
          <div className="bg-white p-5 rounded-full shadow-md mb-5 ring-4 ring-slate-100">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{emptyStateTitle}</h3>
          <p className="max-w-xs mx-auto text-slate-500 mb-6">{emptyStateDescription}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Preview updates in real-time as you type</span>
          </div>
        </div>
      ),
      [emptyStateTitle, emptyStateDescription]
    );

    // Preview content component (shared between desktop and mobile)
    const PreviewContent = useCallback(
      ({ inDrawer = false }: { inDrawer?: boolean }) => {
        // Show skeleton while loading
        if (isLoading) {
          return <ProposalSkeleton />;
        }

        // Show empty state when no valid services
        if (!hasValidServices) {
          return <EmptyState />;
        }

        return (
          <div className={cn('animate-in fade-in duration-500', inDrawer && 'pb-4')}>
            <ProposalPreview
              ref={inDrawer ? undefined : previewRef}
              data={previewDataWithPlaceholders}
              companyInfo={companyInfo}
              photos={photos}
              showPhotos={showPhotos}
            />
          </div>
        );
      },
      [isLoading, hasValidServices, previewDataWithPlaceholders, companyInfo, photos, showPhotos, EmptyState]
    );

    // Don't render anything if not visible
    if (!visible) {
      return null;
    }

    return (
      <>
        {/* Desktop: Sticky Panel */}
        <div
          className={cn(
            'hidden lg:block',
            className
          )}
          data-testid="proposal-preview-pane-desktop"
        >
          <div className="sticky top-4">
            <PreviewContent />
          </div>
        </div>

        {/* Mobile: Bottom Drawer */}
        {hasValidServices && (
          <div className="lg:hidden">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="default"
                  className="fixed bottom-4 right-4 z-40 shadow-lg gap-2 bg-primary hover:bg-primary/90"
                  data-testid="proposal-preview-drawer-trigger"
                >
                  <Eye className="w-4 h-4" />
                  {drawerLabel}
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent
                className="max-h-[90vh] overflow-hidden"
                data-testid="proposal-preview-drawer"
              >
                <DrawerHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <DrawerTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Proposal Preview
                      </DrawerTitle>
                      <DrawerDescription>
                        {hasValidServices
                          ? 'Live preview updates as you edit'
                          : 'Add services to see preview'}
                      </DrawerDescription>
                    </div>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="w-4 h-4" />
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>
                <div
                  className="flex-1 overflow-y-auto p-4"
                  data-testid="proposal-preview-drawer-content"
                >
                  <PreviewContent inDrawer />
                </div>
                <DrawerFooter className="border-t pt-4">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">
                      <EyeOff className="w-4 h-4 mr-2" />
                      Close Preview
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </>
    );
  }
);

ProposalPreviewPane.displayName = 'ProposalPreviewPane';

export default ProposalPreviewPane;
