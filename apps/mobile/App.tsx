import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, Text, View, ActivityIndicator } from "react-native";
import CreateJob from "./src/screens/CreateJob";
import CapturePhotos from "./src/screens/CapturePhotos";
import FindingsSummary from "./src/screens/FindingsSummary";
import DraftPreview from "./src/screens/DraftPreview";
import Settings from "./src/screens/Settings";
import SignIn from "./src/screens/SignIn";
import { getStoredMobileConfig } from "./src/lib/config";

// Scope selection from FindingsSummary screen
type ScopeSelection = {
  selectedTierId?: string;
  answers: Record<string, string | number | boolean | string[]>;
  measurements?: {
    squareFeet?: number;
    linearFeet?: number;
    roomCount?: number;
    wallCount?: number;
    ceilingHeight?: number;
  };
  problemStatement?: string;
};

type Step =
  | { name: "signin" }
  | { name: "create" }
  | { name: "photos"; jobId: number }
  | { name: "findings"; jobId: number }
  | { name: "draft"; jobId: number; draftId: number; draftPayload: unknown; scopeSelection?: ScopeSelection }
  | { name: "settings"; returnTo?: Step };

export default function App() {
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);

  const header = useMemo(() => {
    if (!step || step.name === "signin") return null;

    const title =
      step.name === "create"
        ? "Create Job"
        : step.name === "photos"
          ? "Capture Photos"
          : step.name === "findings"
            ? "Quick Findings"
            : step.name === "draft"
              ? "Draft Preview"
              : "Settings";

    const showSettings = step.name !== "settings";
    return (
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderColor: "#eee",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600" }}>{title}</Text>
        {showSettings ? (
          <Pressable
            onPress={() => setStep((s) => ({ name: "settings", returnTo: s }))}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "600" }}>Settings</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [step]);

  // Check if user is signed in on app start
  useEffect(() => {
    (async () => {
      try {
        const config = await getStoredMobileConfig();
        if (config?.userId) {
          // User has signed in before
          setStep({ name: "create" });
        } else {
          // Show sign in screen
          setStep({ name: "signin" });
        }
      } catch {
        setStep({ name: "signin" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Show loading while checking auth status
  if (loading || !step) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 16, color: "#64748b" }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show sign in screen
  if (step.name === "signin") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <SignIn
          onSignedIn={() => setStep({ name: "create" })}
          onSkip={() => setStep({ name: "create" })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {header}
      {step.name === "settings" && (
        <Settings 
          onDone={() => setStep(step.returnTo || { name: "create" })} 
          onSignOut={() => setStep({ name: "signin" })}
        />
      )}
      {step.name === "create" && (
        <CreateJob
          onCreated={(jobId) => setStep({ name: "photos", jobId })}
        />
      )}
      {step.name === "photos" && (
        <CapturePhotos
          jobId={step.jobId}
          onPhotosReady={() => setStep({ name: "findings", jobId: step.jobId })}
          onDraftReady={(draftId, draftPayload) =>
            setStep({ name: "draft", jobId: step.jobId, draftId, draftPayload })
          }
          onBack={() => setStep({ name: "create" })}
        />
      )}
      {step.name === "findings" && (
        <FindingsSummary
          jobId={step.jobId}
          onScopeConfirmed={(selection) =>
            setStep({ name: "draft", jobId: step.jobId, draftId: 0, draftPayload: null, scopeSelection: selection })
          }
          onBack={() => setStep({ name: "photos", jobId: step.jobId })}
        />
      )}
      {step.name === "draft" && (
        <DraftPreview
          jobId={step.jobId}
          draftId={step.draftId}
          payload={step.draftPayload}
          scopeSelection={step.scopeSelection}
          onDone={() => setStep({ name: "create" })}
          onBack={() => setStep({ name: "findings", jobId: step.jobId })}
        />
      )}
    </SafeAreaView>
  );
}
