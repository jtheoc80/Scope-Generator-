"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bath,
  BriefcaseBusiness,
  ChefHat,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Paintbrush,
  Plus,
  Snowflake,
  User,
  Wrench,
  Zap,
  BrickWall,
  Square,
  Check,
  History,
  ChevronDown,
  X,
  Settings2,
  RefreshCw,
  Fence,
  Car,
  type LucideIcon,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, MobileJob } from "@/app/m/lib/api";
import { 
  validateJobAddress, 
  applyCorrectedAddress,
  type ValidateJobAddressResult,
} from "@/lib/services/addressValidationService";
import {
  getRecentCustomers,
  searchCustomers,
  saveCustomer,
  updateCustomerUsage,
  getCustomerById,
  saveAddress,
  updateAddressUsage,
  getRecentJobTypes,
  addRecentJobType,
  getLastJobSetup,
  saveLastJobSetup,
  syncAllData,
  JOB_TYPES,
  PRIMARY_JOB_TYPES,
  getJobTypeLabel,
  getLastAddressForCustomer,
  saveLastAddressForCustomer,
  SavedCustomer,
  isMeasurementTrade,
} from "@/app/m/lib/job-memory";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { parseEstimateParams, getJobTypeFromEstimate, type EstimateParams } from "@/app/m/lib/estimate-params";
// Google Maps shared config (places, geometry, drawing libraries)
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-config";

const JOB_TYPE_ICONS: Record<string, LucideIcon> = {
  "bathroom-remodel": Bath,
  "kitchen-remodel": ChefHat,
  roofing: Home,
  hvac: Snowflake,
  plumbing: Wrench,
  flooring: Square,
  painting: Paintbrush,
  electrical: Zap,
  windows: Square,
  siding: BrickWall,
  fence: Fence,
  driveway: Car,
};

function JobTypeIcon({ id }: { id: string }) {
  const Icon = JOB_TYPE_ICONS[id] ?? BriefcaseBusiness;
  return <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

// Progress step indicator
function WizardStepper({ currentStep, t }: { currentStep: number; t: ReturnType<typeof useLanguage>['t'] }) {
  const steps = [
    { num: 1, label: t.mobile.setup },
    { num: 2, label: t.mobile.scopeScan },
    { num: 3, label: t.mobile.review },
    { num: 4, label: t.mobile.send },
  ];

  return (
    <nav aria-label="ScopeScan steps" className="w-full">
      <ol className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => {
          const isComplete = step.num < currentStep;
          const isActive = step.num === currentStep;
          return (
            <li key={step.num} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "relative grid h-7 w-7 place-items-center rounded-full border text-xs font-medium transition-colors",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary bg-background",
                    !isComplete && !isActive && "border-border bg-background text-muted-foreground"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : isActive ? (
                    <>
                      <span className="sr-only">{step.num}</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                    </>
                  ) : (
                    <span className="text-muted-foreground">{step.num}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs text-muted-foreground",
                    isActive && "font-semibold text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="mx-2 h-px w-6 bg-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function JobTypeCardButton({
  id,
  label,
  selected,
  onClick,
  badge,
}: {
  id: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:bg-accent"
      )}
      aria-pressed={selected}
    >
      <JobTypeIcon id={id} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">{label}</span>
          {badge && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      {selected && (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}
    </button>
  );
}

// Customer selector with search
function CustomerSelector({
  value,
  onChange,
  disabled,
  onRefresh,
  t,
}: {
  value: SavedCustomer | null;
  onChange: (customer: SavedCustomer | null) => void;
  disabled?: boolean;
  onRefresh?: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const customers = search ? searchCustomers(search) : getRecentCustomers(8);

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const customer = await saveCustomer({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });
      onChange(customer);
      setOpen(false);
      setShowNewForm(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      onRefresh?.();
    } catch (e) {
      console.error("Failed to save customer:", e);
    } finally {
      setSaving(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border bg-background">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{value.name}</p>
            {value.phone && (
              <p className="text-xs text-muted-foreground">{value.phone}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-left font-normal"
          id="customer-combobox"
        >
          <span className="text-muted-foreground">
            {t.mobile.searchCustomersOrAddNew}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] max-w-md p-0" align="start">
        {showNewForm ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{t.mobile.newCustomer}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
                disabled={saving}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder={t.mobile.customerNameRequired}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              disabled={saving}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={t.mobile.phoneOptional}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                type="tel"
                disabled={saving}
              />
              <Input
                placeholder={t.mobile.emailOptional}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                type="email"
                disabled={saving}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleAddNew}
              disabled={!newName.trim() || saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t.mobile.addCustomer}
            </Button>
          </div>
        ) : (
          <Command>
            <CommandInput
              placeholder={t.mobile.searchCustomersOrAddNew}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-center">
                  <p className="text-sm text-slate-500 mb-2">{t.mobile.noCustomersFound}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewName(search);
                      setShowNewForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add &quot;{search}&quot;
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading={t.mobile.recentCustomers}>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={async () => {
                      await updateCustomerUsage(customer.id);
                      onChange(customer);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-md border bg-background">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-slate-500">{customer.phone}</p>
                      )}
                    </div>
                    <Clock className="w-3 h-3 text-slate-400" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="p-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.mobile.addNewCustomer}
                </Button>
              </div>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Import JobAddress type and validation utilities from shared module
import type { JobAddress } from "@/app/m/lib/job-address";
import { isSelectableJobAddress, createJobAddressFromPlace } from "@/app/m/lib/job-address";

// Job Address Selector with strict Places Autocomplete, accuracy gating, and Address Validation
// Uses session tokens for Places API billing optimization
// Flow: Autocomplete -> Place Details (by place_id) -> Address Validation -> Display
function JobAddressSelector({
  value,
  customerId,
  customerName,
  onChange,
  disabled,
  onRefresh,
  autoFocus = false,
  t,
}: {
  value: JobAddress | null;
  customerId?: number;
  customerName?: string;
  onChange: (address: JobAddress | null) => void;
  disabled?: boolean;
  onRefresh?: () => void;
  autoFocus?: boolean;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  // Address correction prompt state
  const [pendingCorrection, setPendingCorrection] = useState<{
    original: JobAddress;
    corrected: string;
  } | null>(null);
  // Validation warnings state
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  // Low quality address state (for inline warning + actions)
  const [isLowQuality, setIsLowQuality] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const hasSelectedRef = useRef(false);
  // Session token for Places API - created on focus, reset after selection
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Get last address for this specific customer (per-customer scoped)
  const lastAddressForCustomer = customerId 
    ? getLastAddressForCustomer(customerId) 
    : null;

  // Create a new session token (call on focus or after selection)
  const createSessionToken = useCallback(() => {
    if (isLoaded && google?.maps?.places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  // Auto-focus input on mount if requested and no address selected
  useEffect(() => {
    if (autoFocus && isLoaded && inputRef.current && !value) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, isLoaded, value]);

  // Validate address through Address Validation API
  // Uses structured fields from Place Details for better accuracy
  const runAddressValidation = useCallback(async (address: JobAddress): Promise<JobAddress | null> => {
    setIsValidating(true);
    setValidationWarnings([]);
    setIsLowQuality(false);
    
    try {
      const result: ValidateJobAddressResult = await validateJobAddress(address);
      
      // Check if we need to offer a correction
      if (result.needsCorrection && result.address.validation?.correctedFormatted) {
        setPendingCorrection({
          original: result.address,
          corrected: result.address.validation.correctedFormatted,
        });
        setIsValidating(false);
        return null; // Don't set address yet - wait for user decision
      }
      
      // Check for low quality verdict (validationGranularity OTHER/ROUTE or unconfirmed components)
      if (result.isLowQuality) {
        setIsLowQuality(true);
      }
      
      // Check for warnings
      if (result.hasWarnings || result.warnings.length > 0) {
        setValidationWarnings(result.warnings);
      }
      
      setIsValidating(false);
      return result.address;
    } catch (err) {
      console.error("Address validation error:", err);
      setIsValidating(false);
      // If validation fails, still return the address as validated
      // to not block the user, but log the error
      return { ...address, validated: true, updatedAt: Date.now() };
    }
  }, []);

  // Handle accepting the corrected address
  const handleAcceptCorrection = useCallback(async () => {
    if (!pendingCorrection) return;
    
    const correctedAddress = applyCorrectedAddress(
      pendingCorrection.original, 
      pendingCorrection.corrected
    );
    
    setPendingCorrection(null);
    onChange(correctedAddress);
    
    // Save as last address for this customer + persist to saved_addresses
    if (customerId && correctedAddress.validated) {
      await saveAddress({
        formatted: correctedAddress.formatted,
        placeId: correctedAddress.placeId,
        lat: String(correctedAddress.lat),
        lng: String(correctedAddress.lng),
        customerId,
      });
      onRefresh?.();
      saveLastAddressForCustomer(customerId, {
        id: -Date.now(),
        formatted: correctedAddress.formatted,
        placeId: correctedAddress.placeId,
        lat: String(correctedAddress.lat),
        lng: String(correctedAddress.lng),
        customerId,
      });
    }
  }, [pendingCorrection, customerId, onChange, onRefresh]);

  // Handle keeping the original address
  const handleKeepOriginal = useCallback(async () => {
    if (!pendingCorrection) return;
    
    const originalAddress = pendingCorrection.original;
    setPendingCorrection(null);
    onChange(originalAddress);
    
    // Save as last address for this customer + persist to saved_addresses
    if (customerId && originalAddress.validated) {
      await saveAddress({
        formatted: originalAddress.formatted,
        placeId: originalAddress.placeId,
        lat: String(originalAddress.lat),
        lng: String(originalAddress.lng),
        customerId,
      });
      onRefresh?.();
      saveLastAddressForCustomer(customerId, {
        id: -Date.now(),
        formatted: originalAddress.formatted,
        placeId: originalAddress.placeId,
        lat: String(originalAddress.lat),
        lng: String(originalAddress.lng),
        customerId,
      });
    }
  }, [pendingCorrection, customerId, onChange, onRefresh]);

  // Track the current input element to detect remounts
  const lastInputElementRef = useRef<HTMLInputElement | null>(null);

  // Initialize Places Autocomplete with session token support
  // Session tokens: created on focus, used for autocomplete + single Place Details call, then reset
  // Re-runs when the input element changes (e.g., after selecting/clearing an address)
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Check if the input element changed (happens when switching between selected/not-selected state)
    const inputElementChanged = lastInputElementRef.current !== inputRef.current;
    
    // If autocomplete already exists and input hasn't changed, skip initialization
    if (autocompleteRef.current && !inputElementChanged) return;
    
    // Clean up old autocomplete if input element changed
    if (autocompleteRef.current && inputElementChanged) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }
    
    // Track the current input element
    lastInputElementRef.current = inputRef.current;
    
    // Create initial session token
    createSessionToken();

    // Initialize autocomplete with address type restriction (not establishments)
    // Default to US for country restriction
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"], // Only address results, not establishments
      componentRestrictions: { country: "us" }, // US only
      fields: ["place_id", "formatted_address", "geometry", "address_components"],
    });

    autocompleteRef.current.addListener("place_changed", async () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place?.place_id || !place?.geometry?.location) {
        // User typed but didn't select from suggestions
        setValidationError("Select an address from the suggestions.");
        return;
      }

      // Clear validation error and mark as selected
      setValidationError(null);
      hasSelectedRef.current = true;

      // Create JobAddress using the helper function
      // This parses address_components into structured fields for validation
      const newAddress = createJobAddressFromPlace(place, inputValue, "places");
      
      if (!newAddress) {
        setValidationError("Could not parse address. Please try a different address.");
        return;
      }
      
      // Add customer ID if available
      if (customerId) {
        newAddress.customerId = String(customerId);
      }
      
      setInputValue(newAddress.formatted);
      
      // Reset session token after selection (Place Details call was made)
      sessionTokenRef.current = null;

      // Run address validation with structured fields
      // This uses line1/city/state/postal from address_components for better accuracy
      const validatedAddress = await runAddressValidation(newAddress);
      
      // If validation returned an address (no pending correction), set it
      if (validatedAddress) {
        onChange(validatedAddress);
        
        // Save as last address for this customer + persist to saved_addresses
        if (customerId && validatedAddress.validated) {
          await saveAddress({
            formatted: validatedAddress.formatted,
            placeId: validatedAddress.placeId,
            lat: String(validatedAddress.lat),
            lng: String(validatedAddress.lng),
            customerId,
          });
          onRefresh?.();
          saveLastAddressForCustomer(customerId, {
            id: -Date.now(),
            formatted: validatedAddress.formatted,
            placeId: validatedAddress.placeId,
            lat: String(validatedAddress.lat),
            lng: String(validatedAddress.lng),
            customerId,
          });
        }
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      lastInputElementRef.current = null;
      sessionTokenRef.current = null;
    };
  }, [isLoaded, customerId, onChange, onRefresh, runAddressValidation, value, inputValue, createSessionToken]);

  // Handle input blur - validate that user selected from suggestions
  const handleInputBlur = useCallback(() => {
    if (inputValue.trim() && !hasSelectedRef.current && !value) {
      setValidationError("Select an address from the suggestions.");
    }
  }, [inputValue, value]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    hasSelectedRef.current = false;
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  // Handle Enter key to accept first suggestion
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key handling is managed by Google Places Autocomplete
    // Just prevent form submission
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }, []);

  // Handle using last address for customer - must re-validate
  const handleUseLastAddress = useCallback(async () => {
    if (!lastAddressForCustomer || !customerId) return;

    const newAddress: JobAddress = {
      placeId: lastAddressForCustomer.placeId || "",
      formatted: lastAddressForCustomer.formatted,
      lat: parseFloat(lastAddressForCustomer.lat || "0"),
      lng: parseFloat(lastAddressForCustomer.lng || "0"),
      source: "last",
      customerId: customerId ? String(customerId) : undefined,
      validated: false, // Must re-validate
      updatedAt: Date.now(),
    };

    // Check basic validity first
    if (!isSelectableJobAddress(newAddress)) {
      setValidationError("Last address is incomplete. Please select a new address.");
      return;
    }

    // Re-run address validation (in case formatting standards changed)
    const validatedAddress = await runAddressValidation(newAddress);
    
    if (validatedAddress) {
      onChange(validatedAddress);
      await updateAddressUsage(lastAddressForCustomer.id);
    }
  }, [lastAddressForCustomer, customerId, onChange, runAddressValidation]);

  // Handle clear address
  const handleClear = useCallback(() => {
    onChange(null);
    setInputValue("");
    setValidationError(null);
    setValidationWarnings([]);
    setIsLowQuality(false);
    setPendingCorrection(null);
    hasSelectedRef.current = false;
    // Create new session token for next search
    createSessionToken();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onChange, createSessionToken]);

  // Handle change address (edit mode)
  const handleChange = useCallback(() => {
    onChange(null);
    setInputValue(value?.formatted || "");
    setValidationError(null);
    setValidationWarnings([]);
    setIsLowQuality(false);
    setPendingCorrection(null);
    hasSelectedRef.current = false;
    // Create new session token for next search
    createSessionToken();
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  }, [onChange, value, createSessionToken]);

  // Handle input focus - create session token if none exists
  const handleInputFocus = useCallback(() => {
    if (!sessionTokenRef.current) {
      createSessionToken();
    }
  }, [createSessionToken]);

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Address autocomplete failed to load. Please refresh and try again.
      </div>
    );
  }

  // PENDING CORRECTION STATE: Show correction prompt
  if (pendingCorrection) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Use standardized address?
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            {pendingCorrection.corrected}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptCorrection}
              className="flex-1 min-h-[44px]"
            >
              <Check className="w-3 h-3 mr-1.5" />
              Use corrected
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleKeepOriginal}
              className="flex-1 min-h-[44px]"
            >
              Keep original
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Original: {pendingCorrection.original.placesFormattedAddress || pendingCorrection.original.formatted}
        </p>
      </div>
    );
  }

  // VALIDATING STATE: Show loading indicator
  if (isValidating) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verifying address…</span>
      </div>
    );
  }

  // SELECTED STATE: Show the selected address with change/clear actions
  if (value && isSelectableJobAddress(value)) {
    const showValidatedBadge = value.validated && !isLowQuality;
    const showWarningBadge = isLowQuality;
    
    return (
      <div className="space-y-2">
        <div className={cn(
          "rounded-lg border px-3 py-2.5",
          isLowQuality 
            ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50"
            : "border-primary/30 bg-primary/5"
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-0.5 grid h-9 w-9 place-items-center rounded-md border bg-background",
                isLowQuality ? "border-amber-300 dark:border-amber-700" : "border-primary/30"
              )}>
                {isLowQuality ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {value.formatted}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                  {showValidatedBadge && (
                    <span className="inline-flex items-center text-[10px] font-medium text-primary">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Verified
                    </span>
                  )}
                  {showWarningBadge && (
                    <span className="inline-flex items-center text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      Needs review
                    </span>
                  )}
                  <button
                    type="button"
                    className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    onClick={handleChange}
                    disabled={disabled}
                  >
                    {isLowQuality ? "Edit address" : "Change"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    onClick={handleClear}
                    disabled={disabled}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
            {!isLowQuality && (
              <CheckCircle2 className="mt-1 h-5 w-5 text-primary" aria-hidden />
            )}
          </div>
        </div>
        
        {/* Validation Warnings - compact inline display */}
        {validationWarnings.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <div className="flex-1">
              {validationWarnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
              {isLowQuality && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center text-xs font-medium text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                    onClick={handleChange}
                    disabled={disabled}
                  >
                    Edit address
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // NOT SELECTED STATE: Show autocomplete input and quick actions
  return (
    <div className="space-y-3">
      {/* Autocomplete Input */}
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={inputRef}
            id="job-address-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={t.mobile.startTypingAddress}
            disabled={disabled || !isLoaded}
            className={cn(
              "pr-10 min-h-[44px]", // min-h-[44px] for large tap target on mobile
              validationError && "border-destructive focus-visible:ring-destructive"
            )}
            autoComplete="off"
          />
          {!isLoaded && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {validationError && (
          <p className="text-xs text-destructive">{validationError}</p>
        )}
        {!validationError && (
          <p className="text-xs text-muted-foreground">
            {t.mobile.startTypingAddress.replace('…', '')}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      {lastAddressForCustomer && customerId && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleUseLastAddress}
            disabled={disabled}
          >
            <History className="w-3 h-3 mr-1.5" />
            {t.mobile.lastForCustomer} {customerName || t.mobile.customer}
          </Button>
        </div>
      )}
    </div>
  );
}

// Inner component that uses useSearchParams (needs Suspense boundary)
function CreateJobPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [jobType, setJobType] = useState("bathroom-remodel");
  const [selectedCustomer, setSelectedCustomer] = useState<SavedCustomer | null>(null);
  // JobAddress is the single source of truth - never auto-populated
  const [selectedAddress, setSelectedAddress] = useState<JobAddress | null>(null);
  const [templateCode, setTemplateCode] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentJobTypes, setRecentJobTypes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [, forceUpdate] = useState(0);
  
  // Estimate handoff state
  const [prefilledFromEstimate, setPrefilledFromEstimate] = useState(false);
  const [estimateParams, setEstimateParams] = useState<EstimateParams | null>(null);
  const hasAppliedEstimateParams = useRef(false);

  // Parse estimate params from URL (from calculator handoff)
  // This runs once on mount and applies params as initial defaults
  useEffect(() => {
    if (hasAppliedEstimateParams.current) return;
    
    const params = parseEstimateParams(searchParams);
    if (params) {
      hasAppliedEstimateParams.current = true;
      setEstimateParams(params);
      
      // Apply job type from trade
      const mappedJobType = getJobTypeFromEstimate(params);
      if (mappedJobType) {
        setJobType(mappedJobType);
      }
      
      // Mark as prefilled for banner display
      setPrefilledFromEstimate(true);
    }
  }, [searchParams]);

  // Load saved state on mount and sync with backend
  // IMPORTANT: Do NOT auto-populate address - user must explicitly select
  // Also skip restoring job type if estimate params were applied
  useEffect(() => {
    const initializeData = async () => {
      // First, load from localStorage for instant display
      const lastSetup = getLastJobSetup();
      const recent = getRecentJobTypes(3);
      setRecentJobTypes(recent);

      // Only apply lastSetup if we didn't get estimate params
      if (lastSetup && !hasAppliedEstimateParams.current) {
        // Only restore job type and customer, NOT address
        setJobType(lastSetup.jobType);
        if (lastSetup.customerId) {
          const customer = getCustomerById(lastSetup.customerId);
          if (customer) setSelectedCustomer(customer);
        }
        // DO NOT restore address - must be explicitly selected by user
        // This was the root cause of the 1/10 accuracy issue
      } else if (recent.length > 0 && !hasAppliedEstimateParams.current) {
        setJobType(recent[0]);
      }

      setInitialized(true);

      // Then sync with backend in background
      setSyncing(true);
      try {
        await syncAllData();
        // Refresh local state after sync
        const newRecent = getRecentJobTypes(3);
        setRecentJobTypes(newRecent);
        forceUpdate((n) => n + 1);
      } catch (e) {
        console.error("Background sync failed:", e);
      } finally {
        setSyncing(false);
      }
    };

    initializeData();
  }, []);

  // Clear address when customer changes (unless explicitly re-selected)
  const handleCustomerChange = useCallback((customer: SavedCustomer | null) => {
    setSelectedCustomer(customer);
    // Clear the current address when customer changes
    // User must explicitly click "Use last address for <customer>" if they want to reuse
    setSelectedAddress(null);
  }, []);

  const handleRefresh = () => {
    forceUpdate((n) => n + 1);
    setRecentJobTypes(getRecentJobTypes(3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Draft-first: Address is now optional for starting the flow
    // If provided, it must be valid and validated
    if (selectedAddress && !isSelectableJobAddress(selectedAddress)) {
      setError("Please select a valid address from the suggestions.");
      return;
    }
    
    if (selectedAddress && !selectedAddress.validated) {
      setError("Please wait for address verification to complete.");
      return;
    }
    
    setBusy(true);
    setError(null);

    // Save to memory (both local and API)
    addRecentJobType(jobType);
    saveLastJobSetup({
      jobType,
      customerId: selectedCustomer?.id,
      // Don't save addressId - user should explicitly select each time
    });

    try {
      const finalJobType = templateCode.trim() || jobType;
      const res = await mobileApiFetch<MobileJob>("/api/mobile/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          jobType: /^\d+$/.test(finalJobType) ? Number(finalJobType) : finalJobType,
          // Draft-first: Customer and address are optional - backend will use defaults
          customer: selectedCustomer?.name || undefined,
          address: selectedAddress?.formatted || undefined,
          // Include lat/lng and placeId if address is provided
          ...(selectedAddress && {
            lat: selectedAddress.lat,
            lng: selectedAddress.lng,
            placeId: selectedAddress.placeId,
          }),
          notes: internalNotes.trim() || undefined,
        }),
      });

      // Route to measurement page for fence/driveway trades, otherwise capture
      if (isMeasurementTrade(finalJobType)) {
        router.push(`/m/measure/${res.jobId}`);
      } else {
        router.push(`/m/capture/${res.jobId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  };

  // Draft-first: Allow starting without address - only require job type
  // Customer and address will be required at final submit/export
  const canStart =
    jobType &&
    !busy &&
    // If address is being validated, wait for it
    !(selectedAddress && !selectedAddress.validated);
  
  // Check if client details are complete (for UI indicator)
  const hasClientDetails = Boolean(selectedCustomer?.name && selectedAddress?.validated);

  // Get unique recent job types not in primary list
  const uniqueRecentTypes = recentJobTypes.filter(
    (rt) => !PRIMARY_JOB_TYPES.some((pt) => pt.id === rt)
  );

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-safe lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2 text-muted-foreground"
            disabled={busy}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.mobile.back}
          </Button>
          {syncing && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {t.mobile.syncing}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <WizardStepper currentStep={1} t={t} />

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl text-foreground">{t.mobile.startScopeScanTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t.mobile.wellRememberCustomers}
          </p>
        </div>

        {/* Prefilled from estimate banner */}
        {prefilledFromEstimate && (
          <div 
            data-testid="banner-prefilled-estimate"
            className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Prefilled from your estimate
                {estimateParams?.trade && (
                  <span className="text-blue-600 dark:text-blue-300">
                    {" "}— {estimateParams.trade}
                    {estimateParams.size && ` (${estimateParams.size})`}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrefilledFromEstimate(false)}
              className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Section 1: Job Type */}
          <Card className="rounded-lg border-border shadow-sm">
            <CardContent className="p-4 lg:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-medium text-foreground">
                  {t.mobile.jobType}
                </Label>
                {uniqueRecentTypes.length > 0 && (
                  <Badge variant="outline" className="h-6 px-2 text-xs text-muted-foreground">
                    {t.mobile.recentAvailable}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {uniqueRecentTypes.map((id) => (
                  <JobTypeCardButton
                    key={id}
                    id={id}
                    label={getJobTypeLabel(id)}
                    selected={jobType === id}
                    onClick={() => setJobType(id)}
                    badge={t.mobile.recent}
                  />
                ))}
                {PRIMARY_JOB_TYPES.map((type) => (
                  <JobTypeCardButton
                    key={type.id}
                    id={type.id}
                    label={type.label}
                    selected={jobType === type.id}
                    onClick={() => setJobType(type.id)}
                  />
                ))}
              </div>

              {/* More options */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                  >
                    {t.mobile.moreJobTypes}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    {JOB_TYPES.filter(
                      (t) => !PRIMARY_JOB_TYPES.some((p) => p.id === t.id)
                    ).map((type) => (
                      <Button
                        key={type.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start",
                          jobType === type.id && "bg-accent text-foreground"
                        )}
                        onClick={() => setJobType(type.id)}
                      >
                        <span className="mr-2">
                          <JobTypeIcon id={type.id} />
                        </span>
                        {type.label}
                        {jobType === type.id && (
                          <Check className="w-3 h-3 ml-auto" />
                        )}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Section 2 & 3: Customer + Address - Side by side on desktop */}
          {/* Draft-first: These are optional for starting - required only at export/send */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-200" data-testid="badge-optional-for-draft">
                {t.mobile.optionalForDraft || "Optional to Start"}
              </span>
              <span>{t.mobile.requiredForExport || "Required to export/send"}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer */}
              <Card className="rounded-lg border-border shadow-sm">
                <CardContent className="p-4 lg:p-6 space-y-3">
                  <Label htmlFor="customer-combobox" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" aria-hidden />
                    {t.mobile.customer}
                  </Label>
                  <CustomerSelector
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    disabled={busy}
                    onRefresh={handleRefresh}
                    t={t}
                  />
                </CardContent>
              </Card>

              {/* Address - Uses strict JobAddress with Places Autocomplete */}
              <Card className="rounded-lg border-border shadow-sm">
                <CardContent className="p-4 lg:p-6 space-y-3">
                  <Label htmlFor="job-address-input" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden />
                    {t.mobile.jobAddress}
                  </Label>
                  <JobAddressSelector
                    value={selectedAddress}
                    customerId={selectedCustomer?.id}
                    customerName={selectedCustomer?.name}
                    onChange={setSelectedAddress}
                    disabled={busy}
                    onRefresh={handleRefresh}
                    autoFocus={false} // Don't auto-focus - it's optional now
                    t={t}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Section (collapsed) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced" className="border rounded-lg border-border bg-card shadow-sm">
              <AccordionTrigger className="px-4 py-3 lg:px-6 text-sm text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" aria-hidden />
                  {t.mobile.advancedOptional}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 lg:px-6 lg:pb-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="templateCode"
                      className="text-sm text-muted-foreground"
                    >
                      {t.mobile.templateCode}
                    </Label>
                    <Input
                      id="templateCode"
                      placeholder={t.mobile.onlyIfGivenCode}
                      value={templateCode}
                      onChange={(e) => setTemplateCode(e.target.value)}
                      disabled={busy}
                    />
                    <p className="text-xs text-slate-400">
                      {t.mobile.leaveBlankToUseJobType}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="internalNotes"
                      className="text-sm text-muted-foreground"
                    >
                      {t.mobile.internalNotes}
                    </Label>
                    <Input
                      id="internalNotes"
                      placeholder={t.mobile.notesForYourReferenceOnly}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* CTA */}
          <div className="space-y-2 pt-2 max-w-md mx-auto md:max-w-lg">
            <Button
              type="submit"
              className="w-full min-h-12 text-base gap-2"
              disabled={!canStart}
              data-testid="button-start-scopescan"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.mobile.starting}
                </>
              ) : (
                <>
                  {t.mobile.startScopeScan}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            {/* Draft-first: Show different helper text based on state */}
            {!busy && !hasClientDetails && (
              <p className="text-center text-xs text-slate-500" data-testid="helper-draft-mode">
                {t.mobile.draftModeHelper || "You can add customer & address later before sending"}
              </p>
            )}
            <p className="text-center text-xs text-slate-500">
              {t.mobile.nextCapturePhotos}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function CreateJobPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <CreateJobPageInner />
    </Suspense>
  );
}
