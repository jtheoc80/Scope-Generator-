"use client";

import { useEffect, useState } from "react";

type RekognitionLabel = {
  Name?: string;
  Confidence?: number;
};

export default function CameraUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<RekognitionLabel[]>([]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLabels([]);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setLabels([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error analyzing image: ${data?.error || "Request failed"}`);
        return;
      }

      if (data?.success) {
        setLabels(Array.isArray(data.labels) ? data.labels : []);
      } else {
        alert(`Error analyzing image: ${data?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Site Inspection</h2>

      {/* 1. Camera Input */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <label className="cursor-pointer block">
          <span className="sr-only">Take photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">Tap to open camera</p>
      </div>

      {/* 2. Image Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Site Preview"
            className="w-full h-48 object-cover rounded-lg"
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "Analyzing Scope..." : "Generate Proposal Items"}
          </button>
        </div>
      )}

      {/* 3. Results */}
      {labels.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Detected Items:</h3>
          <ul className="space-y-2">
            {labels.map((label, index) => (
              <li
                key={`${label.Name ?? "label"}-${index}`}
                className="flex justify-between items-center bg-gray-100 p-2 rounded"
              >
                <span className="text-gray-800">{label.Name ?? "Unknown"}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {typeof label.Confidence === "number"
                    ? `${Math.round(label.Confidence)}%`
                    : "-"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
