"use client";

import { useEffect, useRef, useState } from "react";

type FeedbackState = {
  tone: "success" | "error" | "info";
  message: string;
};

const documentOptions = [
  { value: "BST", label: "Basic Safety Training (BST)" },
  { value: "AFF", label: "Advanced Fire Fighting (AFF)" },
  { value: "MEFA", label: "Medical First Aid (MEFA)" },
  { value: "SCRB", label: "Survival Craft & Rescue Boat (SCRB)" },
  { value: "PASSPORT", label: "Passport" },
  { value: "SEAMAN_BOOK", label: "Seaman Book" },
];

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
        message: "Pilih file dokumen terlebih dahulu.",
      } as const;
    }

    const isSupported = candidate.type ? allowedMime.some((type) => candidate.type === type || (type.startsWith("image/") && candidate.type.startsWith("image/"))) : true;
    if (!isSupported) {
      return {
        valid: false,
        message: "Format tidak didukung. Gunakan JPG, PNG, HEIC, atau PDF.",
      } as const;
    }

    if (candidate.size > maxSizeBytes) {
      return {
        valid: false,
        message: "Ukuran file terlalu besar (maksimal 10 MB).",
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
    setFeedback({ tone: "info", message: "Mengunggah dokumen, mohon tunggu sebentar..." });
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
        throw new Error("Upload gagal, silakan coba ulang.");
      }

      setFeedback({
        tone: "success",
        message: "Upload sukses! Dokumen akan diverifikasi oleh staff kantor.",
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
      const details = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
      setFeedback({ tone: "error", message: details });
      resetProgressTimer();
      setProgress(null);
    } finally {
      setLoading(false);
      resetProgressTimer();
    }
  };

  const feedbackClasses = {
    success: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40",
    error: "bg-rose-500/15 text-rose-300 border border-rose-400/40",
    info: "bg-sky-500/15 text-sky-200 border border-sky-400/30",
  } as const;

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
          <h2 className="text-base font-semibold text-slate-100">Informasi Dokumen</h2>
          <p className="text-sm text-slate-400">
            Ensure foto terlihat jelas dan seluruh halaman sertifikat terbaca.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Jenis Dokumen
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
            File Dokumen
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
                Maksimal 10 MB, format JPG, PNG, atau PDF. Gunakan kamera belakang untuk hasil terbaik.
              </p>
              {file && (
                <p className="mt-3 text-xs font-medium text-slate-200">
                  Dipilih: {file.name}
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
          {loading ? "Mengunggah..." : "Kirim Dokumen"}
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
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${feedbackClasses[feedback.tone]}`}
        >
          {feedback.message}
        </div>
      )}
    </form>
  );
}
