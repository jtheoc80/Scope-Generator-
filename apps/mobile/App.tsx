import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, Text, View, ActivityIndicator } from "react-native";
import CreateJob from "./src/screens/CreateJob";
import CapturePhotos from "./src/screens/CapturePhotos";
import DraftPreview from "./src/screens/DraftPreview";
import Settings from "./src/screens/Settings";
import SignIn from "./src/screens/SignIn";
import { getStoredMobileConfig } from "./src/lib/config";

type Step =
  | { name: "signin" }
  | { name: "create" }
  | { name: "photos"; jobId: number }
  | { name: "draft"; jobId: number; draftId: number; draftPayload: unknown }
  | { name: "settings"; returnTo?: Step };

export default function App() {
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);

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

  const header = useMemo(() => {
    const title =
      step.name === "create"
        ? "Create Job"
        : step.name === "photos"
          ? "Capture Photos"
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
          onDraftReady={(draftId, draftPayload) =>
            setStep({ name: "draft", jobId: step.jobId, draftId, draftPayload })
          }
          onBack={() => setStep({ name: "create" })}
        />
      )}
      {step.name === "draft" && (
        <DraftPreview
          jobId={step.jobId}
          draftId={step.draftId}
          payload={step.draftPayload}
          onDone={() => setStep({ name: "create" })}
          onBack={() => setStep({ name: "photos", jobId: step.jobId })}
        />
      )}
    </SafeAreaView>
  );
}
