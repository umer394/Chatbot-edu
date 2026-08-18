"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, FileType, ImageIcon, Paperclip, Upload, X } from "lucide-react";

import type { TemplateAttachment } from "@/types/campaign";
import { Button } from "@/components/ui/button";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_MB = 10;

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp";

const ALLOWED_EXTENSIONS = new Set(
  ACCEPT.split(",").map((ext) => ext.trim().toLowerCase())
);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".csv": "text/csv",
  };
  return map[ext] || "application/octet-stream";
}

function fileIcon(name: string, mimeType: string) {
  if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    return FileType;
  }
  if (mimeType.startsWith("image/")) return ImageIcon;
  return FileText;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function isAllowedFile(file: File): boolean {
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  return ALLOWED_EXTENSIONS.has(ext);
}

type Props = {
  attachments: TemplateAttachment[];
  onChange: (attachments: TemplateAttachment[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export default function TemplateAttachmentDropzone({
  attachments,
  onChange,
  onError,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;
      const list = Array.from(files);
      if (!list.length) return;

      setProcessing(true);
      const next = [...attachments];
      const errors: string[] = [];

      for (const file of list) {
        if (!isAllowedFile(file)) {
          errors.push(`"${file.name}" is not supported. Use PDF, images, or documents.`);
          continue;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          errors.push(`"${file.name}" exceeds ${MAX_ATTACHMENT_MB} MB.`);
          continue;
        }
        if (next.some((a) => a.name === file.name)) {
          errors.push(`"${file.name}" is already attached.`);
          continue;
        }
        try {
          const contentBase64 = await readFileAsBase64(file);
          next.push({
            name: file.name,
            mimeType: inferMimeType(file),
            contentBase64,
          });
        } catch {
          errors.push(`Could not read "${file.name}".`);
        }
      }

      if (errors.length) onError?.(errors.join(" "));
      if (next.length !== attachments.length) onChange(next);
      setProcessing(false);
    },
    [attachments, disabled, onChange, onError]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium">
          {processing ? "Processing files…" : "Drop files here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, Word, Excel, images, text — up to {MAX_ATTACHMENT_MB} MB each
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((file, index) => {
            const Icon = fileIcon(file.name, file.mimeType);
            const sizeBytes = Math.round((file.contentBase64.length * 3) / 4);
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mimeType === "application/pdf" ? "PDF · " : ""}
                    {formatBytes(sizeBytes)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(attachments.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {attachments.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments are sent with email campaigns (PDF supported).
        </p>
      )}
    </div>
  );
}
