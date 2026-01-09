"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface PhotoUploadProps {
  seafarerId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated: (photoUrl: string) => void;
}

export default function PhotoUpload({
  seafarerId,
  currentPhotoUrl,
  onPhotoUpdated,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("seafarerId", seafarerId);

      const response = await fetch(`/api/crewing/seafarers/${seafarerId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setPreview(data.photoUrl);
      onPhotoUpdated(data.photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Photo Display */}
      <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
        {preview ? (
          <Image
            src={preview}
            alt="Crew photo"
            width={128}
            height={128}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload Photo
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 px-3 py-2 rounded-lg w-full">
          {error}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        JPG, PNG or GIF (Max 5MB)
      </p>
    </div>
  );
}
