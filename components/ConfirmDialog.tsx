"use client";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50"
    >
      <div className="bg-paper border border-rule max-w-sm w-full p-6">
        <h2 className="font-serif text-lg text-ink mb-2">{title}</h2>
        <p className="text-sm text-ink2 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="focus-ring text-sm text-ink2 border border-rule px-3 py-1.5 hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={[
              "focus-ring text-sm px-3 py-1.5 text-paper transition-colors",
              danger ? "bg-rust hover:bg-rust/80" : "bg-ink hover:bg-ink2",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
