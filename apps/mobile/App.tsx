import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import CreateJob from "./src/screens/CreateJob";
import CapturePhotos from "./src/screens/CapturePhotos";
import DraftPreview from "./src/screens/DraftPreview";
import Settings from "./src/screens/Settings";

type Step =
  | { name: "create" }
  | { name: "photos"; jobId: number }
  | { name: "draft"; jobId: number; draftId: number; draftPayload: unknown }
  | { name: "settings"; returnTo?: Step };

export default function App() {
  const [step, setStep] = useState<Step>({ name: "create" });

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
        <Settings onDone={() => setStep(step.returnTo || { name: "create" })} />
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
