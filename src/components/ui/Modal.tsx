import { type ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl border border-border bg-surface p-0 text-text-primary shadow-xl backdrop:bg-black/50"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        {/* Rubriken och stängknappen ligger kvar vid scroll */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <h2
            id={titleId}
            className="min-w-0 break-words text-base font-semibold"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {/* Långa formulär scrollas inne i dialogen */}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}