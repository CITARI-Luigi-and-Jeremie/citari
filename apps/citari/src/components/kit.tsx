import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Rule({ className, strong }: { className?: string; strong?: boolean }) {
  return (
    <hr
      className={cn("border-0 border-t", strong ? "border-t-rule-strong" : "border-t-rule", className)}
    />
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-xs", className)}>{children}</div>;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("num", className)}>{children}</span>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "encre" | "ligne" | "nu";
  size?: "md" | "lg";
};

export function Btn({ variant = "encre", size = "md", className, ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm border",
        "text-[13px] font-medium tracking-[0.02em]",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "lg" ? "px-7 py-3.5" : "px-5 py-2.5",
        variant === "encre" &&
          "border-ink bg-ink text-paper shadow-soft hover:-translate-y-px hover:bg-signal hover:border-signal hover:shadow-lift",
        variant === "ligne" && "border-rule-strong bg-transparent text-ink hover:border-ink hover:bg-paper-2",
        variant === "nu" && "border-transparent px-0 text-ink-3 hover:text-signal",
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label-xs block pb-2">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

const champBase =
  "w-full rounded-sm border border-rule bg-card px-3.5 py-2.5 text-[15px] outline-none transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] placeholder:text-ink-3/70 hover:border-rule-strong focus:border-signal focus:shadow-[0_0_0_3px_var(--accent-wash)]";

export function Champ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(champBase, className)} />;
}

export function Choix({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(champBase, "appearance-none pr-8", className)}>
      {children}
    </select>
  );
}

/** Le geste signature : la ligne restée vide, et « RIEN » au bout. */
export function LigneVide({ legende, className }: { legende?: string; className?: string }) {
  return (
    <div className={cn("flex items-end gap-5", className)}>
      <div className="flex-1">
        {legende ? <span className="label-xs block pb-2.5">{legende}</span> : null}
        <div className="h-px w-full bg-rule-strong" />
      </div>
      <span className="shrink-0 quote-serif text-[17px] leading-none text-signal">rien</span>
    </div>
  );
}

export function Etiquette({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "signal" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em]",
        ton === "signal" ? "border-signal/40 bg-signal-tint text-signal" : "border-rule bg-paper-2 text-ink-3",
      )}
    >
      {children}
    </span>
  );
}
