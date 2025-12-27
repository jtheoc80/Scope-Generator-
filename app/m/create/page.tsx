"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  User,
  MapPin,
  Loader2,
  Check,
  Plus,
  Clock,
  Navigation,
  History,
  ChevronDown,
  X,
  Settings2,
  RefreshCw,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, MobileJob } from "../lib/api";
import {
  getCustomers,
  getRecentCustomers,
  searchCustomers,
  saveCustomer,
  updateCustomerUsage,
  getCustomerById,
  getAddresses,
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
  getJobTypeIcon,
  SavedCustomer,
  SavedAddress,
} from "../lib/job-memory";
import { cn } from "@/lib/utils";

// Progress step indicator
function ProgressPill({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Setup" },
    { num: 2, label: "ScopeScan" },
    { num: 3, label: "Review" },
    { num: 4, label: "Send" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 text-xs">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full transition-colors",
              step.num === currentStep
                ? "bg-orange-500 text-white font-medium"
                : step.num < currentStep
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <span>{step.num}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className="w-2 h-px bg-slate-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// Job type chip component
function JobTypeChip({
  id,
  label,
  icon,
  selected,
  onClick,
  isRecent,
}: {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  isRecent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border",
        selected
          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50",
        isRecent && !selected && "border-dashed"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {selected && <Check className="w-3.5 h-3.5 ml-0.5" />}
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
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{value.name}</p>
            {value.phone && (
              <p className="text-xs text-slate-500">{value.phone}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="text-slate-400 hover:text-slate-600"
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
          className="w-full justify-between h-12 text-left font-normal"
        >
          <span className="text-muted-foreground">
            Search customers or add new…
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-md p-0" align="start">
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
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
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
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">
                {value.formatted}
              </p>
              <button
                type="button"
                className="text-xs text-green-600 hover:text-green-700 mt-1"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                Change address
              </button>
            </div>
          </div>
          <Check className="w-4 h-4 text-green-600 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-12 text-left font-normal"
          >
            <span className="text-muted-foreground">
              Start typing an address…
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] max-w-md p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Start typing an address…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {addresses.length === 0 && search && (
                <div className="p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
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

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-9"
          onClick={handleUseLocation}
          disabled={disabled || isLocating || saving}
        >
          {isLocating ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <Navigation className="w-3 h-3 mr-1.5" />
          )}
          Use current location
        </Button>
        {lastAddress && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={async () => {
              await updateAddressUsage(lastAddress.id);
              onChange(lastAddress);
            }}
            disabled={disabled}
          >
            <History className="w-3 h-3 mr-1.5" />
            Use last address
          </Button>
        )}
      </div>
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
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2"
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
      <ProgressPill currentStep={1} />

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Start ScopeScan™</h1>
        <p className="text-sm text-slate-500">
          We&apos;ll remember customers + addresses for next time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Section 1: Job Type */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              Job Type
            </Label>

            {/* Recent job types (if different from primary) */}
            {uniqueRecentTypes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueRecentTypes.map((id) => (
                    <JobTypeChip
                      key={id}
                      id={id}
                      label={getJobTypeLabel(id)}
                      icon={getJobTypeIcon(id)}
                      selected={jobType === id}
                      onClick={() => setJobType(id)}
                      isRecent
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Primary job type chips */}
            <div className="flex flex-wrap gap-2">
              {PRIMARY_JOB_TYPES.map((type) => (
                <JobTypeChip
                  key={type.id}
                  id={type.id}
                  label={type.label}
                  icon={type.icon}
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
                  className="text-xs text-slate-500"
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
                        jobType === type.id && "bg-orange-50 text-orange-700"
                      )}
                      onClick={() => setJobType(type.id)}
                    >
                      <span className="mr-2">{type.icon}</span>
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
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
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
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
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
          <AccordionItem value="advanced" className="border rounded-lg border-slate-200">
            <AccordionTrigger className="px-4 py-3 text-sm text-slate-500 hover:no-underline">
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Advanced (optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="templateCode"
                  className="text-sm text-slate-600"
                >
                  Template Code
                </Label>
                <Input
                  id="templateCode"
                  placeholder="Only if you were given a code"
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  disabled={busy}
                  className="h-10"
                />
                <p className="text-xs text-slate-400">
                  Leave blank to use the selected job type
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="internalNotes"
                  className="text-sm text-slate-600"
                >
                  Internal Notes
                </Label>
                <Input
                  id="internalNotes"
                  placeholder="Notes for your reference only"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={busy}
                  className="h-10"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* CTA */}
        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            className="w-full h-14 text-base gap-2 bg-orange-500 hover:bg-orange-600 shadow-md"
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
