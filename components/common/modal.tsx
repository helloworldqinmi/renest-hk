"use client";

import { BrandLogo } from "./brand-logo";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** The shadcn Dialog composition, styled with ReNest tokens. */
export function Modal({ open, onClose, title, children, wide = false, fullScreen = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; fullScreen?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-scrim" />
        <Dialog.Content aria-describedby={undefined} className={`modal-dialog ${wide ? "modal-wide" : ""} ${fullScreen ? "modal-fullscreen" : ""}`}>
          <div className="modal-head"><div><div style={{ marginBottom: 18 }}><BrandLogo compact /></div><Dialog.Title>{title}</Dialog.Title></div><Dialog.Close className="icon-button" aria-label="Close dialog"><X size={18} /></Dialog.Close></div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
