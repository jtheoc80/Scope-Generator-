'use client';

import { useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getRecentCustomers,
  searchCustomers,
  saveCustomer,
  updateCustomerUsage,
  type SavedCustomer,
} from '@/app/m/lib/job-memory';
import { ChevronDown, Clock, Loader2, Plus, User, X, Mail, Phone } from 'lucide-react';

export type CustomerPickerProps = {
  value: SavedCustomer | null;
  onChange: (customer: SavedCustomer | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  'data-testid'?: string;
};

export default function CustomerPicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = 'Search customers or add new…',
  'data-testid': testId,
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const customers = useMemo(() => {
    return search ? searchCustomers(search) : getRecentCustomers(8);
  }, [search]);

  const handleSelect = async (customer: SavedCustomer) => {
    try {
      await updateCustomerUsage(customer.id);
    } catch {
      // Ignore update failures (local-first).
    }
    onChange(customer);
    setOpen(false);
  };

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
      setSearch('');
      setNewName('');
      setNewPhone('');
      setNewEmail('');
    } finally {
      setSaving(false);
    }
  };

  if (value) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5',
          className,
        )}
        data-testid={testId}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border bg-background">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {value.name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {value.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {value.phone}
                </span>
              ) : null}
              {value.email ? (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {value.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="text-muted-foreground"
          aria-label="Clear customer"
        >
          <X className="h-4 w-4" />
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
          className={cn(
            'w-full justify-between text-left font-normal',
            className,
          )}
          data-testid={testId}
        >
          <span className="text-muted-foreground">{placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-md p-0 sm:w-[400px]"
        align="start"
      >
        {showNewForm ? (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">New customer</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Customer name (required)"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add customer
            </Button>
          </div>
        ) : (
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-center">
                  <p className="mb-2 text-sm text-slate-500">
                    No customers found
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewName(search);
                      setShowNewForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add &quot;{search}&quot;
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Recent customers">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      void handleSelect(customer);
                    }}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-md border bg-background">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{customer.name}</p>
                      {customer.phone ? (
                        <p className="truncate text-xs text-slate-500">
                          {customer.phone}
                        </p>
                      ) : customer.email ? (
                        <p className="truncate text-xs text-slate-500">
                          {customer.email}
                        </p>
                      ) : null}
                    </div>
                    <Clock className="h-3 w-3 text-slate-400" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
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

