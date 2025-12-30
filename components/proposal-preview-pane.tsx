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
import { Eye, EyeOff, X, FileText, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export interface ProposalPreviewData {
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
 * ProposalPreviewPane - Responsive preview pane component
 * 
 * Desktop: Sticky panel on the right
 * Mobile: Bottom drawer that can be opened/closed
 * 
 * Uses placeholders for empty client/address fields
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
      emptyStateTitle = 'Ready to Start',
      emptyStateDescription = 'Fill in the form details to see a live preview of your proposal.',
      className,
    },
    ref
  ) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // Expose ref handle for parent components
    useImperativeHandle(ref, () => ({
      previewRef,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }));

    // Memoize preview data with placeholders for empty fields
    const previewDataWithPlaceholders = useMemo(() => {
      return {
        ...data,
        clientName: data.clientName?.trim() || 'Client Name',
        address: data.address?.trim() || 'Job Address',
      };
    }, [data]);

    // Empty state component
    const EmptyState = useCallback(
      () => (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 text-center">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">{emptyStateTitle}</h3>
          <p className="max-w-xs mx-auto mt-2">{emptyStateDescription}</p>
        </div>
      ),
      [emptyStateTitle, emptyStateDescription]
    );

    // Preview content component (shared between desktop and mobile)
    const PreviewContent = useCallback(
      ({ inDrawer = false }: { inDrawer?: boolean }) => {
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
      [hasValidServices, previewDataWithPlaceholders, companyInfo, photos, showPhotos, EmptyState]
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
