"use client";

import { useEffect, useRef, useState } from "react";
import { InlineNotice } from "@/components/feedback/InlineNotice";
import { DOCUMENT_TYPES } from "@/lib/document-types";

type FeedbackState = {
  tone: "success" | "error" | "info";
  message: string;
};

const documentOptions = DOCUMENT_TYPES.map((doc) => ({
  value: doc.value,
  label: doc.label,
}));

export default function UploadForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(documentOptions[0].value);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB limit

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const validateFile = (candidate: File | null) => {
    if (!candidate) {
      return {
        valid: false,
        message: "Please select a document file first.",
      } as const;
    }

    const isSupported = candidate.type ? allowedMime.some((type) => candidate.type === type || (type.startsWith("image/") && candidate.type.startsWith("image/"))) : true;
    if (!isSupported) {
      return {
        valid: false,
        message: "Unsupported file format. Use JPG, PNG, HEIC, or PDF.",
      } as const;
    }

    if (candidate.size > maxSizeBytes) {
      return {
        valid: false,
        message: "File size exceeds the 10 MB limit.",
      } as const;
    }

    return { valid: true } as const;
  };

  const resetProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateFile(file);
    if (!validation.valid) {
      setFeedback({ tone: "error", message: validation.message });
      return;
    }

    resetProgressTimer();
    setLoading(true);
    setFeedback({ tone: "info", message: "Uploading document, please wait..." });
    setProgress(12);

    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current === null) return 12;
        if (current >= 90) return current;
        return current + 8;
      });
    }, 280);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", documentType);

    try {
      const response = await fetch("/api/mobile/crew/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload could not be completed. Please try again.");
      }

      setFeedback({
        tone: "success",
        message: "Upload completed. The office team will verify this document before it is cleared.",
      });
      setProgress(100);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => {
        setProgress(null);
        resetProgressTimer();
      }, 1000);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : "An unexpected error occurred during upload.";
      setFeedback({ tone: "error", message: details });
      resetProgressTimer();
      setProgress(null);
    } finally {
      setLoading(false);
      resetProgressTimer();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const validation = validateFile(selected);
    if (!validation.valid) {
      setFeedback({ tone: "error", message: validation.message });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      return;
    }

    setFeedback(null);
    setFile(selected);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-slate-100">Document Intake</h2>
          <p className="text-sm text-slate-400">
            Submit a clear scan so the office can verify your record without follow-up delay.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Document Type
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-100 outline-none ring-0 transition focus:border-slate-500"
            >
              {documentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Document File
            <div className="mt-2 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                className="mx-auto block text-sm text-slate-300"
              />
              <p className="mt-3 text-xs text-slate-500">
                Maximum 10 MB. Use JPG, PNG, HEIC, or PDF. Use the rear camera for the clearest result.
              </p>
              {file && (
                <p className="mt-3 text-xs font-medium text-slate-200">
                  Selected file: {file.name}
                </p>
              )}
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-emerald-200"
        >
          {loading ? "Uploading..." : "Submit Document"}
        </button>

        {progress !== null && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <span>Progress</span>
              <span>{Math.min(progress, 100)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <InlineNotice
          tone={feedback.tone}
          message={feedback.message}
          className="border-slate-700/60 bg-slate-900/80 text-slate-100 shadow-none"
        />
      )}
    </form>
  );
}
