"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  title,
  description,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="glass relative z-10 w-full max-w-md rounded-2xl border border-white/20 p-6 shadow-2xl backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {description && <p className="text-sm text-white/70">{description}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-medium text-white transition hover:from-red-600 hover:to-red-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
