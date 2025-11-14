"use client";

import { type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

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
  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 sm:w-auto"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      {children ?? <p className="text-sm text-slate-600">This action cannot be undone.</p>}
    </Modal>
  );
}
