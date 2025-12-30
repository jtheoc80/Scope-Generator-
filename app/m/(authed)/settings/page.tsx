"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react";
import { saveConfig, clearConfig, getConfig } from "../../lib/api";

export default function MobileWebSettings() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cfg = getConfig();
    setBaseUrl(cfg.baseUrl);
    setApiKey(cfg.apiKey || "");
    setUserId(cfg.userId || "");
    setLoaded(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      if (!baseUrl.trim()) {
        throw new Error("API Base URL is required");
      }

      saveConfig({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        userId: userId.trim() || undefined,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearConfig();
    const defaultCfg = getConfig();
    setBaseUrl(defaultCfg.baseUrl);
    setApiKey("");
    setUserId("");
  };

  const isLocalUrl = baseUrl.includes("localhost") || 
                      baseUrl.includes("127.0.0.1") || 
                      baseUrl.includes("0.0.0.0");

  if (!loaded) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure how the mobile web app connects to your ScopeGen backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Settings saved successfully
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="baseUrl">API Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {isLocalUrl && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  This is a local URL. For production use, set it to your public domain.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Mobile API Key (optional)</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <p className="text-xs text-slate-500">
              Required if your server uses API key authentication
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">Mobile User ID (optional)</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="USER_ID"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <p className="text-xs text-slate-500">
              Used to identify the user making requests
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={saving}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            This is the mobile web version of ScopeGen. It provides the same photo capture
            and proposal generation features as the native app, but runs in your browser.
          </p>
          <p>
            All data is processed through your configured API endpoint. Photos are
            uploaded directly to your storage service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
