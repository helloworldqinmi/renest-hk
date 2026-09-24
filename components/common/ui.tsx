import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
};

export function Button({ className, variant = "primary", icon: Icon, children, ...props }: ButtonProps) {
  return (
    <button className={cn("button", `button-${variant}`, className)} {...props}>
      {Icon ? <Icon size={17} strokeWidth={2} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: ButtonProps["variant"]; className?: string }) {
  return (
    <Link href={href} className={cn("button", `button-${variant}`, className)}>
      {children}
      {variant === "primary" ? <ArrowRight size={17} aria-hidden /> : null}
    </Link>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function Metric({ value, label, note, accent }: { value: string; label: string; note?: string; accent?: boolean }) {
  return (
    <div className={cn("metric", accent && "metric-accent")}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <div className={cn("modal", wide && "modal-wide")} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">ReSpace HK</div>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
