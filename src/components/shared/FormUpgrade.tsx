import React, { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Save, AlertTriangle, UploadCloud, CheckCircle2, RefreshCw } from "lucide-react";

interface FormUpgradeProps<T> {
  draftKey: string;
  initialValues: T;
  onSave: (values: T) => void;
  children: (props: {
    values: T;
    setValues: React.Dispatch<React.SetStateAction<T>>;
    handleChange: (field: keyof T, val: unknown) => void;
  }) => ReactNode;
  title?: string;
  subtitle?: string;
}

export function FormUpgrade<T extends Record<string, unknown>>({
  draftKey,
  initialValues,
  onSave,
  children,
  title,
  subtitle,
}: FormUpgradeProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(`horizon_draft_${draftKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setValues(parsed);
        setDraftRestored(true);
        setHasUnsaved(true);
      } catch (e) {
        console.error("Failed to parse form draft", e);
      }
    }
  }, [draftKey]);

  // Auto save draft on change
  useEffect(() => {
    if (hasUnsaved) {
      const timer = setTimeout(() => {
        localStorage.setItem(`horizon_draft_${draftKey}`, JSON.stringify(values));
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSavedTime(now);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [values, draftKey, hasUnsaved]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsaved]);

  const handleChange = (field: keyof T, val: unknown) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    setHasUnsaved(true);
    setDraftRestored(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
    localStorage.removeItem(`horizon_draft_${draftKey}`);
    setHasUnsaved(false);
    setDraftRestored(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(`horizon_draft_${draftKey}`);
    setValues(initialValues);
    setHasUnsaved(false);
    setDraftRestored(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
      {(title || subtitle) && (
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-display font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {lastSavedTime && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="size-3.5" />
              <span>Draft saved at {lastSavedTime}</span>
            </div>
          )}
        </div>
      )}

      {draftRestored && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-xs text-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Unsaved draft restored from previous session.</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="h-7 text-xs hover:bg-amber-500/20">
            Discard Draft
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {children({ values, setValues, handleChange })}
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasUnsaved && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <RefreshCw className="size-3 animate-spin" /> Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={clearDraft} disabled={!hasUnsaved}>
            Reset
          </Button>
          <Button type="submit" className="gap-2 gradient-primary text-primary-foreground shadow-md hover:opacity-95">
            <Save className="size-4" /> Save Record
          </Button>
        </div>
      </div>
    </form>
  );
}

export function FileDropzone({
  onFileSelect,
  accept = "*/*",
  label = "Drag & drop files here, or click to upload",
}: {
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  label?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0].name);
      onFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/20"
      }`}
      onClick={() => document.getElementById("file-upload-input")?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0].name);
            onFileSelect(e.target.files);
          }
        }}
      />
      <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center">
        <UploadCloud className="size-5" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {selectedFile ? <span className="text-emerald-500 font-semibold">{selectedFile}</span> : label}
      </div>
      <div className="text-xs text-muted-foreground">Supports PDF, Excel, DOCX, PNG, JPG up to 25MB</div>
    </div>
  );
}
