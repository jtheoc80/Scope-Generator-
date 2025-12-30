'use client';
import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Search, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

declare global {
  interface Window {
    onebuild?: {
      init: (config: { key: string }) => void;
      open: (options?: { uoms?: string[] }) => void;
      on: (event: string, callback: (data: unknown) => void) => void;
    };
    ONEBUILD_KEY?: string;
  }
}

export default function CostLookupPage() {
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Cost Lookup | Real-Time Material & Labor Pricing | ScopeGen";
    
    fetch("/api/onebuild-key")
      .then(res => res.json())
      .then(data => {
        console.log("1build key fetched:", data.key ? "yes" : "no");
        if (data.key) {
          const checkWidget = () => {
            if (window.onebuild) {
              console.log("1build widget found, initializing...");
              try {
                window.onebuild.init({ key: data.key });
                
                window.onebuild.on("error", (error: unknown) => {
                  console.error("1build widget error:", error);
                  setWidgetError(`Widget error: ${JSON.stringify(error)}`);
                });
                
                setWidgetReady(true);
                setIsLoading(false);
                console.log("1build widget initialized");
              } catch (err) {
                console.error("1build init error:", err);
                setWidgetError(`Initialization failed: ${err}`);
                setIsLoading(false);
              }
            } else {
              console.log("Waiting for 1build widget...");
              setTimeout(checkWidget, 100);
            }
          };
          checkWidget();
        } else {
          setWidgetError("API key not configured");
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("1build error:", err);
        setWidgetError(`Failed to load: ${err.message}`);
        setIsLoading(false);
      });
  }, []);

  const openWidget = () => {
    console.log("Opening 1build widget...");
    if (window.onebuild) {
      try {
        window.onebuild.open({ uoms: [] });
        
        setTimeout(() => {
          const widgetModal = document.querySelector('[data-1build-modal]') || 
                              document.querySelector('.onebuild-modal') ||
                              document.querySelector('iframe[src*="1build"]');
          
          const anyModal = document.querySelector('[role="dialog"]');
          if (!anyModal && !widgetModal) {
            console.log("No modal detected after 2s - widget may have failed");
          }
        }, 2000);
      } catch (err) {
        console.error("Failed to open widget:", err);
        setWidgetError(`Failed to open: ${err}`);
      }
    } else {
      console.error("1build widget not available");
      setWidgetError("Widget not loaded. Please refresh the page.");
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Calculator className="h-4 w-4" />
            Real-Time Cost Data
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Real-Time Cost Lookup
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Search live pricing for materials, labor, and equipment across 3,000+ US counties
          </p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="text-center p-6 bg-slate-50 rounded-xl">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Live Pricing</h3>
                <p className="text-slate-600 text-sm">68 million data points updated daily from suppliers</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-xl">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Local Rates</h3>
                <p className="text-slate-600 text-sm">Pricing specific to your county and region</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-xl">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">All Trades</h3>
                <p className="text-slate-600 text-sm">Materials, labor & equipment for every CSI division</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Try the Cost Lookup Widget
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Search for any construction material, labor rate, or equipment rental. Get real-time pricing for your area.
              </p>
              
              {widgetError && (
                <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-500 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Widget Configuration Issue</AlertTitle>
                  <AlertDescription>
                    The cost lookup feature requires configuration. Please ensure the cost data API key has the correct domain configured as a referrer.
                    <br />
                    <span className="text-xs opacity-75 mt-2 block">Technical: {widgetError}</span>
                  </AlertDescription>
                </Alert>
              )}
              
              {isLoading ? (
                <div className="text-primary-foreground/60">
                  Loading widget...
                </div>
              ) : widgetReady && !widgetError ? (
                <Button 
                  size="lg" 
                  className="bg-secondary text-slate-900 hover:bg-secondary/90 text-lg px-8 py-6"
                  onClick={openWidget}
                  data-testid="open-cost-lookup"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Open Cost Lookup
                </Button>
              ) : !widgetError ? (
                <div className="text-primary-foreground/60">
                  Widget unavailable
                </div>
              ) : null}
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Example Searches</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {["2x4 lumber", "drywall", "plumber hourly", "electrician labor", "concrete", "roofing shingles", "toilet installation", "paint gallon"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      if (widgetReady) openWidget();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
