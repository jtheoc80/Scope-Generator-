"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, MapPin, Briefcase, Loader2 } from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, MobileJob } from "../lib/api";

export default function CreateJobPage() {
  const router = useRouter();
  const [jobType, setJobType] = useState("bathroom-remodel");
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await mobileApiFetch<MobileJob>("/api/mobile/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          jobType: /^\d+$/.test(jobType) ? Number(jobType) : jobType,
          customer: customer.trim() || "Customer",
          address: address.trim() || "Address TBD",
        }),
      });

      // Navigate to photo capture with the new job ID
      router.push(`/m/capture/${res.jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Back button */}
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

      <Card>
        <CardHeader>
          <CardTitle>New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="jobType" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Type
              </Label>
              <select
                id="jobType"
                value={jobType}
                onChange={(e) => {
                  setError(null);
                  setJobType(e.target.value);
                }}
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={busy}
              >
                <optgroup label="Bathroom">
                  <option value="bathroom-remodel">Bathroom Remodel</option>
                  <option value="shower-replacement">Shower Replacement</option>
                  <option value="tub-to-shower">Tub to Shower Conversion</option>
                </optgroup>
                <optgroup label="Kitchen">
                  <option value="kitchen-remodel">Kitchen Remodel</option>
                  <option value="cabinet-refacing">Cabinet Refacing</option>
                  <option value="countertop-replacement">Countertop Replacement</option>
                </optgroup>
                <optgroup label="Exterior">
                  <option value="roofing">Roofing</option>
                  <option value="siding">Siding</option>
                  <option value="windows">Windows</option>
                  <option value="doors">Doors</option>
                </optgroup>
                <optgroup label="Systems">
                  <option value="hvac">HVAC</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="flooring">Flooring</option>
                  <option value="painting">Painting</option>
                  <option value="demo">General Demo/Estimate</option>
                </optgroup>
              </select>
              <p className="text-xs text-slate-500">
                Or enter a template ID number directly
              </p>
              <Input
                placeholder="Template ID (optional)"
                value={/^\d+$/.test(jobType) ? jobType : ""}
                onChange={(e) => {
                  setError(null);
                  if (e.target.value) {
                    setJobType(e.target.value);
                  } else {
                    // Reset to default dropdown selection when cleared
                    setJobType("bathroom-remodel");
                  }
                }}
                type="number"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name
              </Label>
              <Input
                id="customer"
                value={customer}
                onChange={(e) => {
                  setError(null);
                  setCustomer(e.target.value);
                }}
                placeholder="Jane Doe"
                autoComplete="name"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Job Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => {
                  setError(null);
                  setAddress(e.target.value);
                }}
                placeholder="123 Main St, City, State"
                autoComplete="street-address"
                disabled={busy}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Continue to Photos"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500">
        Next: Capture photos of the job site
      </p>
    </div>
  );
}
