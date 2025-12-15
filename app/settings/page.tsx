'use client';
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, Upload, X, Settings as SettingsIcon, Building2, CheckCircle, DollarSign, Wrench, CreditCard, AlertTriangle, Key, ExternalLink, Eye, EyeOff, Bell, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { templates } from "@/lib/proposal-data";
import CancelFeedbackModal from "@/components/cancel-feedback-modal";

export default function Settings() {
  const { user, isLoading: authLoading, refetch } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [priceMultiplier, setPriceMultiplier] = useState(100);
  const [tradeMultipliers, setTradeMultipliers] = useState<Record<string, number>>({});
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceledMessage, setCanceledMessage] = useState<string | null>(null);
  const [userStripeSecretKey, setUserStripeSecretKey] = useState("");
  const [userStripeEnabled, setUserStripeEnabled] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const allTradeIds = templates.map(t => t.id);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      setCanceledMessage('Your subscription changes have been saved. Thank you for your feedback.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || "");
      setCompanyAddress(user.companyAddress || "");
      setCompanyPhone(user.companyPhone || "");
      setLicenseNumber(user.licenseNumber || "");
      setCompanyLogo(user.companyLogo || null);
      setPriceMultiplier(user.priceMultiplier || 100);
      setTradeMultipliers((user.tradeMultipliers as Record<string, number>) || {});
      const userTrades = user.selectedTrades || [];
      setSelectedTrades(userTrades);
      setUserStripeSecretKey("");
      setUserStripeEnabled(user.userStripeEnabled || false);
      setEmailNotificationsEnabled(user.emailNotificationsEnabled !== false);
      setSmsNotificationsEnabled(user.smsNotificationsEnabled || false);
    }
  }, [user]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t.settings.invalidFileType,
        description: t.settings.uploadImageFile,
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t.settings.fileTooLarge,
        description: t.settings.uploadSmallerImage,
        variant: "destructive",
      });
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCompanyLogo(event.target?.result as string);
      setLogoUploading(false);
    };
    reader.onerror = () => {
      toast({
        title: t.settings.uploadFailed,
        description: t.settings.couldNotReadFile,
        variant: "destructive",
      });
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: companyName || null,
          companyAddress: companyAddress || null,
          companyPhone: companyPhone || null,
          licenseNumber: licenseNumber || null,
          companyLogo: companyLogo || null,
          priceMultiplier,
          tradeMultipliers,
          selectedTrades,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }

      await refetch();
      toast({
        title: t.settings.settingsSaved,
        description: t.settings.profileUpdated,
      });
    } catch (error: any) {
      toast({
        title: t.settings.errorSavingSettings,
        description: error.message || t.settings.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async () => {
    setSavingStripe(true);
    try {
      const res = await fetch("/api/profile/stripe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userStripeSecretKey: userStripeSecretKey || null,
          userStripeEnabled,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }

      await refetch();
      toast({
        title: t.settings.stripeSettingsSaved,
        description: userStripeEnabled 
          ? t.settings.paymentLinksNowEnabled
          : t.settings.stripeSettingsUpdated,
      });
    } catch (error: any) {
      toast({
        title: t.settings.errorSavingStripe,
        description: error.message || t.settings.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setSavingStripe(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const res = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emailNotificationsEnabled,
          smsNotificationsEnabled,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }

      await refetch();
      toast({
        title: t.settings.notificationsSaved,
        description: t.settings.notificationsSavedDesc,
      });
    } catch (error: any) {
      toast({
        title: t.settings.errorSavingNotifications,
        description: error.message || t.settings.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-2xl font-bold mb-4">{t.settings.signInRequired}</h2>
          <p className="text-muted-foreground mb-6">{t.settings.signInDesc}</p>
          <a href="/api/login" className="bg-primary text-white px-6 py-3 rounded-md font-semibold">
            {t.settings.signInWithReplit}
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-12">
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900">{t.settings.title}</h1>
                <p className="text-slate-500 text-sm">{t.settings.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t.settings.companyProfile}
              </CardTitle>
              <CardDescription>
                {t.settings.companyProfileDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-logo">{t.settings.companyLogo}</Label>
                <div className="flex items-start gap-4">
                  {companyLogo ? (
                    <div className="relative">
                      <img
                        src={companyLogo}
                        alt="Company logo"
                        className="w-24 h-24 object-contain border border-slate-200 rounded-lg bg-white p-2"
                        data-testid="img-company-logo"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        data-testid="button-remove-logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-colors"
                      data-testid="button-upload-logo"
                    >
                      {logoUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">{t.settings.upload}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      data-testid="input-logo-file"
                    />
                    <p className="text-sm text-slate-500">
                      {t.settings.companyLogoDesc}
                    </p>
                    {!companyLogo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading}
                      >
                        {t.settings.chooseFile}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">{t.settings.companyName}</Label>
                <Input
                  id="company-name"
                  placeholder={t.settings.companyNamePlaceholder}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">{t.settings.companyAddress}</Label>
                <Textarea
                  id="company-address"
                  placeholder={t.settings.companyAddressPlaceholder}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={3}
                  data-testid="input-company-address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-phone">{t.settings.companyPhone}</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  placeholder={t.settings.companyPhonePlaceholder}
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  data-testid="input-company-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license-number">{t.settings.licenseNumber}</Label>
                <Input
                  id="license-number"
                  placeholder={t.settings.licenseNumberPlaceholder}
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  data-testid="input-license-number"
                />
                <p className="text-xs text-slate-500">
                  {t.settings.licenseNumberDesc}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t.settings.servicesYouOffer}</Label>
                </div>
                <p className="text-sm text-slate-500">
                  {t.settings.servicesDesc}
                </p>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTrades(allTradeIds)}
                    data-testid="button-select-all-trades"
                  >
                    {t.settings.selectAll}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTrades([])}
                    data-testid="button-clear-trades"
                  >
                    {t.settings.clearAll}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trade-${template.id}`}
                        checked={selectedTrades.includes(template.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTrades([...selectedTrades, template.id]);
                          } else {
                            setSelectedTrades(selectedTrades.filter(t => t !== template.id));
                          }
                        }}
                        data-testid={`checkbox-trade-${template.id}`}
                      />
                      <Label
                        htmlFor={`trade-${template.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {template.trade}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedTrades.length === 0 && (
                  <p className="text-sm text-orange-600">
                    {t.settings.selectAtLeastOneTrade}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t.settings.pricingAdjustment}</Label>
                </div>
                <p className="text-sm text-slate-500">
                  {t.settings.pricingAdjustmentDesc}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{t.settings.priceMultiplier}</span>
                    <span className="text-lg font-semibold text-primary" data-testid="text-price-multiplier">
                      {priceMultiplier}%
                    </span>
                  </div>
                  <Slider
                    value={[priceMultiplier]}
                    onValueChange={(value) => setPriceMultiplier(value[0])}
                    min={25}
                    max={200}
                    step={5}
                    className="w-full"
                    data-testid="slider-price-multiplier"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>25% ({t.settings.lower})</span>
                    <span>100% ({t.settings.base})</span>
                    <span>200% ({t.settings.higher})</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 mt-2">
                    <p className="text-sm text-slate-600">
                      <strong>{t.settings.pricingExample}</strong> {t.settings.pricingExampleText}{" "}
                      <span className="font-semibold text-primary">
                        ${((1000 * priceMultiplier) / 100).toLocaleString()}
                      </span>{" "}
                      {t.settings.onYourProposals}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-Trade Multipliers */}
              {selectedTrades.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">{t.settings.perTradePricing}</Label>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t.settings.perTradePricingDesc}
                  </p>
                  <div className="space-y-4">
                    {selectedTrades.map((tradeId) => {
                      const template = templates.find(t => t.id === tradeId);
                      const multiplier = tradeMultipliers[tradeId] ?? 100;
                      return (
                        <div key={tradeId} className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">{template?.trade || tradeId}</span>
                            <span className="text-sm font-semibold text-primary" data-testid={`text-trade-multiplier-${tradeId}`}>
                              {multiplier}%
                            </span>
                          </div>
                          <Slider
                            value={[multiplier]}
                            onValueChange={(value) => {
                              setTradeMultipliers(prev => ({
                                ...prev,
                                [tradeId]: value[0]
                              }));
                            }}
                            min={50}
                            max={150}
                            step={5}
                            className="w-full"
                            data-testid={`slider-trade-multiplier-${tradeId}`}
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>50%</span>
                            <span>100%</span>
                            <span>150%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>{t.settings.perTradePricingHow}</strong> {t.settings.perTradePricingFormula} {t.settings.perTradePricingExample} ${((1000 * 1.1 * 1.2)).toLocaleString()}.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto"
                  data-testid="button-save-settings"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.settings.saveChanges}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management Card */}
          {user.stripeCustomerId && (
            <Card className="border-none shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t.settings.subscription}
                </CardTitle>
                <CardDescription>
                  {t.settings.subscriptionDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canceledMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{canceledMessage}</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{t.settings.currentPlan}</p>
                    <p className="text-sm text-slate-500">
                      {user.isPro ? t.settings.proPlan : t.settings.freePlan}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isPro && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        {t.settings.active}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/stripe/portal", {
                          method: "POST",
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        toast({
                          title: t.common.error,
                          description: t.settings.couldNotOpenBilling,
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-manage-billing"
                  >
                    {t.settings.manageBilling}
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelModal(true)}
                    data-testid="button-cancel-subscription"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t.settings.cancelSubscription}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stripe Integration Card - Payment Links */}
          <Card className="border-none shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                {t.settings.paymentLinks}
              </CardTitle>
              <CardDescription>
                {t.settings.paymentLinksDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{t.settings.howItWorks}</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>{t.settings.howItWorksItem1}</li>
                  <li>{t.settings.howItWorksItem2}</li>
                  <li>{t.settings.howItWorksItem3}</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">{t.settings.stripeLiveSecretKey}</Label>
                  <div className="relative">
                    <Input
                      id="stripe-key"
                      type={showStripeKey ? "text" : "password"}
                      placeholder={t.settings.stripePlaceholder}
                      value={userStripeSecretKey}
                      onChange={(e) => setUserStripeSecretKey(e.target.value)}
                      className="pr-10"
                      data-testid="input-stripe-key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeKey(!showStripeKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-testid="button-toggle-stripe-key"
                    >
                      {showStripeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t.settings.findKeyInDashboard}{" "}
                    <a 
                      href="https://dashboard.stripe.com/apikeys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {t.settings.stripeDashboard} <ExternalLink className="w-3 h-3" />
                    </a>
                    . {t.settings.dontHaveStripe}{" "}
                    <a 
                      href="https://dashboard.stripe.com/register" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {t.settings.signUpFree} <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>

                {user?.hasStripeKey && !userStripeSecretKey && (
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex gap-2">
                    <CheckCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">
                      {t.settings.stripeKeyConfigured}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label htmlFor="stripe-enabled" className="font-medium">{t.settings.enablePaymentLinks}</Label>
                    <p className="text-sm text-slate-500">
                      {t.settings.allowGeneratingLinks}
                    </p>
                  </div>
                  <Switch
                    id="stripe-enabled"
                    checked={userStripeEnabled}
                    onCheckedChange={setUserStripeEnabled}
                    disabled={!userStripeSecretKey && !user?.hasStripeKey}
                    data-testid="switch-stripe-enabled"
                  />
                </div>

                {userStripeEnabled && (userStripeSecretKey || user?.hasStripeKey) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">
                      {t.settings.paymentLinksEnabled}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveStripe}
                  disabled={savingStripe}
                  className="w-full sm:w-auto"
                  data-testid="button-save-stripe"
                >
                  {savingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.settings.saveStripeSettings}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <Card className="border-none shadow-sm mt-6" data-testid="card-notification-preferences">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t.settings.notificationPreferences}
              </CardTitle>
              <CardDescription>
                {t.settings.notificationPreferencesDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">{t.settings.emailNotifications}</Label>
                      <p className="text-sm text-slate-500">
                        {t.settings.emailNotificationsDesc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotificationsEnabled}
                    onCheckedChange={setEmailNotificationsEnabled}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <Label htmlFor="sms-notifications" className="font-medium">{t.settings.smsNotifications}</Label>
                      <p className="text-sm text-slate-500">
                        {t.settings.smsNotificationsDesc}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {t.settings.smsRequiresPhone}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={smsNotificationsEnabled}
                    onCheckedChange={setSmsNotificationsEnabled}
                    data-testid="switch-sms-notifications"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="w-full sm:w-auto"
                  data-testid="button-save-notifications"
                >
                  {savingNotifications ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.settings.saveNotificationSettings}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CancelFeedbackModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onComplete={(portalUrl) => {
          setShowCancelModal(false);
          if (portalUrl) {
            window.location.href = portalUrl;
          }
        }}
      />
    </Layout>
  );
}
