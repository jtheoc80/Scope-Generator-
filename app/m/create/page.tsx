"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Navigation,
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
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, MobileJob } from "../lib/api";
import {
  getRecentCustomers,
  searchCustomers,
  saveCustomer,
  updateCustomerUsage,
  getCustomerById,
  getRecentAddresses,
  searchAddresses,
  saveAddress,
  updateAddressUsage,
  getAddressById,
  getRecentJobTypes,
  addRecentJobType,
  getLastJobSetup,
  saveLastJobSetup,
  syncAllData,
  JOB_TYPES,
  PRIMARY_JOB_TYPES,
  getJobTypeLabel,
  SavedCustomer,
  SavedAddress,
} from "../lib/job-memory";
import { cn } from "@/lib/utils";

type LucideIconComponent = (props: {
  className?: string;
  "aria-hidden"?: boolean;
}) => React.ReactElement;

const JOB_TYPE_ICONS: Record<string, LucideIconComponent> = {
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
};

function JobTypeIcon({ id }: { id: string }) {
  const Icon = JOB_TYPE_ICONS[id] ?? BriefcaseBusiness;
  return <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

// Progress step indicator
function WizardStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Setup" },
    { num: 2, label: "ScopeScan" },
    { num: 3, label: "Review" },
    { num: 4, label: "Send" },
  ];

  return (
    <nav aria-label="ScopeScan steps" className="w-full">
      <ol className="flex flex-wrap justify-center gap-2 sm:gap-4">
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
                    "hidden sm:inline text-xs text-muted-foreground",
                    isActive && "font-semibold text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden sm:block mx-2 h-px w-6 bg-border" aria-hidden />
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
        "relative flex w-full min-h-11 items-center gap-3 rounded-lg border bg-background px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
}: {
  value: SavedCustomer | null;
  onChange: (customer: SavedCustomer | null) => void;
  disabled?: boolean;
  onRefresh?: () => void;
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
          className="w-full justify-between text-left font-normal min-h-11"
          id="customer-combobox"
        >
          <span className="text-muted-foreground">
            Search customers or add new…
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-md p-0" align="start">
        {showNewForm ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">New Customer</h4>
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
              placeholder="Customer name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              disabled={saving}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                type="tel"
                disabled={saving}
              />
              <Input
                placeholder="Email (optional)"
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
              Add Customer
            </Button>
          </div>
        ) : (
          <Command>
            <CommandInput
              placeholder="Search customers…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-center">
                  <p className="text-sm text-slate-500 mb-2">No customers found</p>
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
              <CommandGroup heading="Recent Customers">
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
                  Add new customer
                </Button>
              </div>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Address selector with search
function AddressSelector({
  value,
  customerId,
  onChange,
  disabled,
  onRefresh,
}: {
  value: SavedAddress | null;
  customerId?: number;
  onChange: (address: SavedAddress | null) => void;
  disabled?: boolean;
  onRefresh?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addresses = search ? searchAddresses(search) : getRecentAddresses(5);
  const lastAddress = getRecentAddresses(1)[0];

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      // For now, create a simple address from coordinates
      // In production, you'd use Google Places reverse geocoding
      const formatted = `${position.coords.latitude.toFixed(
        6
      )}, ${position.coords.longitude.toFixed(6)}`;

      setSaving(true);
      const address = await saveAddress({
        formatted,
        customerId,
        lat: position.coords.latitude.toString(),
        lng: position.coords.longitude.toString(),
      });
      onChange(address);
      setOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("Geolocation error:", err);
      alert("Unable to get your location. Please enter the address manually.");
    } finally {
      setIsLocating(false);
      setSaving(false);
    }
  };

  const handleManualAddress = async () => {
    if (!search.trim()) return;
    setSaving(true);
    try {
      const address = await saveAddress({
        formatted: search.trim(),
        customerId,
      });
      onChange(address);
      setOpen(false);
      setSearch("");
      onRefresh?.();
    } catch (e) {
      console.error("Failed to save address:", e);
    } finally {
      setSaving(false);
    }
  };

  if (value) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-md border bg-background">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {value.formatted}
              </p>
              <button
                type="button"
                className="mt-1 text-xs text-primary underline-offset-4 hover:underline"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                Change address
              </button>
            </div>
          </div>
          <CheckCircle2 className="mt-1 h-4 w-4 text-primary" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="address-combobox"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="address-command-list"
                  placeholder="Start typing an address…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setOpen(true)}
                  disabled={disabled}
                  className="pr-10 h-11"
                />
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                  aria-hidden
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-w-md p-0" align="start">
              <Command>
                <CommandList id="address-command-list">
                  {addresses.length === 0 && search && (
                    <div className="p-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full min-h-11"
                        onClick={handleManualAddress}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Use &quot;{search}&quot;
                      </Button>
                    </div>
                  )}
                  {addresses.length > 0 && (
                    <CommandGroup heading="Recent Addresses">
                      {addresses.map((address) => (
                        <CommandItem
                          key={address.id}
                          value={address.formatted}
                          onSelect={async () => {
                            await updateAddressUsage(address.id);
                            onChange(address);
                            setOpen(false);
                          }}
                          className="flex items-center gap-3 py-2"
                        >
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="flex-1 text-sm">{address.formatted}</span>
                          <History className="w-3 h-3 text-slate-400" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto min-h-11"
          onClick={handleUseLocation}
          disabled={disabled || isLocating || saving}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Use current location
        </Button>
      </div>

      {lastAddress && (
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-11 justify-start"
          onClick={async () => {
            await updateAddressUsage(lastAddress.id);
            onChange(lastAddress);
          }}
          disabled={disabled}
        >
          <History className="w-4 h-4 mr-2" />
          Use last address
        </Button>
      )}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();
  const [jobType, setJobType] = useState("bathroom-remodel");
  const [selectedCustomer, setSelectedCustomer] = useState<SavedCustomer | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [templateCode, setTemplateCode] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentJobTypes, setRecentJobTypes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [, forceUpdate] = useState(0);

  // Load saved state on mount and sync with backend
  useEffect(() => {
    const initializeData = async () => {
      // First, load from localStorage for instant display
      const lastSetup = getLastJobSetup();
      const recent = getRecentJobTypes(3);
      setRecentJobTypes(recent);

      if (lastSetup) {
        setJobType(lastSetup.jobType);
        if (lastSetup.customerId) {
          const customer = getCustomerById(lastSetup.customerId);
          if (customer) setSelectedCustomer(customer);
        }
        if (lastSetup.addressId) {
          const address = getAddressById(lastSetup.addressId);
          if (address) setSelectedAddress(address);
        }
      } else if (recent.length > 0) {
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

  const handleRefresh = () => {
    forceUpdate((n) => n + 1);
    setRecentJobTypes(getRecentJobTypes(3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Save to memory (both local and API)
    addRecentJobType(jobType);
    saveLastJobSetup({
      jobType,
      customerId: selectedCustomer?.id,
      addressId: selectedAddress?.id,
    });

    try {
      const finalJobType = templateCode.trim() || jobType;
      const res = await mobileApiFetch<MobileJob>("/api/mobile/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          jobType: /^\d+$/.test(finalJobType) ? Number(finalJobType) : finalJobType,
          customer: selectedCustomer?.name || "Customer",
          address: selectedAddress?.formatted || "Address TBD",
          notes: internalNotes.trim() || undefined,
        }),
      });

      router.push(`/m/capture/${res.jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  };

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
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-safe space-y-6">
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
          Back
        </Button>
        {syncing && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing…
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <WizardStepper currentStep={1} />

      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl text-foreground">Start ScopeScan™</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll remember customers + addresses for next time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Section 1: Job Type */}
        <Card className="rounded-lg border bg-background shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium text-foreground">
                Job Type
              </Label>
              {uniqueRecentTypes.length > 0 && (
                <Badge variant="outline" className="h-6 px-2 text-xs text-muted-foreground">
                  Recent available
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {uniqueRecentTypes.map((id) => (
                <JobTypeCardButton
                  key={id}
                  id={id}
                  label={getJobTypeLabel(id)}
                  selected={jobType === id}
                  onClick={() => setJobType(id)}
                  badge="Recent"
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
                  More job types…
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

        {/* Section 2: Customer */}
        <Card className="rounded-lg border bg-background shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <Label htmlFor="customer-combobox" className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" aria-hidden />
              Customer
            </Label>
            <CustomerSelector
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              disabled={busy}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>

        {/* Section 3: Address */}
        <Card className="rounded-lg border bg-background shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <Label htmlFor="address-combobox" className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden />
              Job Address
            </Label>
            <AddressSelector
              value={selectedAddress}
              customerId={selectedCustomer?.id}
              onChange={setSelectedAddress}
              disabled={busy}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>

        {/* Advanced Section (collapsed) */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced" className="rounded-lg border bg-background shadow-sm">
            <AccordionTrigger className="px-4 sm:px-6 py-4 text-sm text-muted-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" aria-hidden />
                Advanced (optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-6 pb-6 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="templateCode"
                  className="text-sm text-muted-foreground"
                >
                  Template Code
                </Label>
                <Input
                  id="templateCode"
                  placeholder="Only if you were given a code"
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  disabled={busy}
                  className="h-11"
                />
                <p className="text-xs text-slate-400">
                  Leave blank to use the selected job type
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="internalNotes"
                  className="text-sm text-muted-foreground"
                >
                  Internal Notes
                </Label>
                <Input
                  id="internalNotes"
                  placeholder="Notes for your reference only"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={busy}
                  className="h-11"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* CTA */}
        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            className="w-full min-h-12 sm:min-h-11 text-base gap-2"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Start ScopeScan
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-slate-500">
            Next: capture photos of the job site
          </p>
        </div>
      </form>
    </div>
  );
}
