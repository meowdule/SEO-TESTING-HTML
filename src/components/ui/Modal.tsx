import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onBackdropClick?: boolean;
};

export function Modal({ open, title, onClose, children, onBackdropClick = true }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (onBackdropClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="row-between" style={{ marginTop: 4 }}>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        취소
      </Button>
      <Button type="submit" variant="primary" size="sm">
        {submitLabel}
      </Button>
    </div>
  );
}
