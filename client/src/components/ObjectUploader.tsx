import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: { uploadURL: string }[] }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      alert('File size too large');
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await onGetUploadParameters();
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.ok) {
        onComplete?.({
          successful: [{ uploadURL: url }]
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        accept="image/*"
      />
      <Button
        onClick={() => document.getElementById('file-upload')?.click()}
        className={buttonClassName}
        disabled={isUploading}
        type="button"
      >
        {isUploading ? 'Uploading...' : children}
      </Button>
    </div>
  );
}