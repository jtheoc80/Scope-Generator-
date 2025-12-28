"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Plus, Settings, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function MobileWebHome() {
  return (
    <div className="px-4 py-6 pb-safe lg:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-2 lg:py-6">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to ScopeGen</h2>
          <p className="text-slate-600 mt-2">Snap photos → generate scopes + estimates</p>
        </div>

        {/* Primary cards - side-by-side on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Main CTA - ScopeScan */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                <Camera className="w-5 h-5 text-orange-600" />
                ScopeScan™
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-800">
                Snap a few photos → we generate a scope + estimate
              </p>
              <p className="text-xs text-orange-700">
                Best results: 6–10 photos (wide + closeups)
              </p>
              <Link href="/m/create" className="block">
                <Button
                  className="w-full h-14 text-base gap-3 bg-orange-500 hover:bg-orange-600 shadow-md"
                  size="lg"
                >
                  <Camera className="w-5 h-5" />
                  Start ScopeScan
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-xs text-orange-700 text-center">
                Capture → Auto-Scope → Review → Send
              </p>
            </CardContent>
          </Card>

          {/* Quick Start Steps */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                How ScopeScan Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <div>
                  <p className="font-medium text-slate-800">Enter Job Details</p>
                  <p className="text-xs text-slate-500">Customer name, address, and job type</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <p className="font-medium text-slate-800">📷 Capture</p>
                  <p className="text-xs text-slate-500">Take wide shots + closeups</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <p className="font-medium text-slate-800">Auto-Scope</p>
                  <p className="text-xs text-slate-500">We generate a scope + estimate</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-medium text-slate-800">Review & Send</p>
                  <p className="text-xs text-slate-500">Finalize and send a pro PDF</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary section - becomes two columns on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Secondary Actions */}
          <div className="space-y-3">
            <Link href="/m/create" className="block">
              <Button variant="outline" className="w-full h-12 gap-2 border-slate-300">
                <Plus className="w-4 h-4" />
                Create Proposal Manually
              </Button>
            </Link>

            <Link href="/m/settings" className="block">
              <Button variant="ghost" className="w-full gap-2 text-slate-500">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </div>

          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                💡 Pro Tips for Better ScopeScans
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-800 space-y-1">
              <p>• Take wide shots to show the full scope</p>
              <p>• Capture close-ups of problem areas</p>
              <p>• More photos = more accurate estimates</p>
              <p>• First photo becomes the cover</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Mobile Web Version • Works on any device
        </p>
      </div>
    </div>
  );
}
