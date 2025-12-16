import { useMemo, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import CreateJob from "./src/screens/CreateJob";
import CapturePhotos from "./src/screens/CapturePhotos";
import DraftPreview from "./src/screens/DraftPreview";

type Step =
  | { name: "create" }
  | { name: "photos"; jobId: number }
  | { name: "draft"; jobId: number; draftId: number; draftPayload: unknown };

export default function App() {
  const [step, setStep] = useState<Step>({ name: "create" });

  const header = useMemo(() => {
    const title =
      step.name === "create"
        ? "Create Job"
        : step.name === "photos"
          ? "Capture Photos"
          : "Draft Preview";

    return (
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>{title}</Text>
      </View>
    );
  }, [step.name]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {header}
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
