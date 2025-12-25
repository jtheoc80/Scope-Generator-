"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Plus, Settings, FileText } from "lucide-react";

export default function MobileWebHome() {
  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome to ScopeGen</h2>
        <p className="text-slate-600 mt-2">
          Capture job site photos and generate professional proposals instantly
        </p>
      </div>

      {/* Main Actions */}
      <div className="space-y-3">
        <Link href="/m/create" className="block">
          <Button className="w-full h-14 text-base gap-3" size="lg">
            <Plus className="w-5 h-5" />
            Start New Job
          </Button>
        </Link>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                1
              </span>
              <p>Enter customer details and select the job type</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                2
              </span>
              <p>Take photos of the job site using your phone&apos;s camera</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                3
              </span>
              <p>Generate a draft proposal with AI-powered scope items</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                4
              </span>
              <p>Review, customize pricing, and submit to create your proposal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Link */}
      <div className="pt-4">
        <Link href="/m/settings" className="block">
          <Button variant="outline" className="w-full gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Footer info */}
      <p className="text-center text-xs text-slate-400 pt-4">
        Mobile Web Version • Works on any device
      </p>
    </div>
  );
}
