'use client';

import { Fragment, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  widthClass = 'max-w-lg',
}: ModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className={clsx(
          'glass relative z-10 w-full rounded-2xl border border-white/20 p-6 shadow-2xl backdrop-blur-md',
          widthClass,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-1 pr-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-white/70">{description}</p>}
        </div>
        <div className="mt-5 space-y-4">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">{footer}</div>
        )}
      </div>
    </div>
  );

  return createPortal(<Fragment>{modalContent}</Fragment>, document.body);
}
