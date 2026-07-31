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
        "inline-flex items-center justify-center gap-2 border transition-colors duration-[140ms] ease-linear disabled:opacity-40 disabled:cursor-not-allowed",
        "font-mono text-[12px] uppercase tracking-[0.14em]",
        size === "lg" ? "px-6 py-4" : "px-4 py-2.5",
        variant === "encre" && "bg-ink text-paper border-ink hover:bg-bordeaux hover:border-bordeaux",
        variant === "ligne" && "bg-transparent text-ink border-rule-strong hover:border-ink hover:bg-paper-2",
        variant === "nu" && "border-transparent px-0 text-ink-3 hover:text-ink",
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
      <span className="label-xs block pb-1.5">{label}</span>
      {children}
      {hint ? <span className="mt-1 block font-mono text-[11px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

const champBase =
  "w-full border-0 border-b border-rule-strong bg-transparent px-0 py-2 text-[16px] outline-none transition-colors duration-[140ms] ease-linear placeholder:text-ink-3/70 focus:border-bordeaux";

export function Champ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(champBase, className)} />;
}

export function Choix({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(champBase, "appearance-none pr-6", className)}>
      {children}
    </select>
  );
}

/** Le geste signature : la ligne restée vide, et « RIEN » au bout. */
export function LigneVide({ legende, className }: { legende?: string; className?: string }) {
  return (
    <div className={cn("flex items-end gap-4", className)}>
      <div className="flex-1">
        {legende ? <span className="label-xs block pb-2">{legende}</span> : null}
        <div className="h-px w-full bg-ink" />
      </div>
      <span className="num shrink-0 pb-[-2px] text-[13px] tracking-[0.3em] text-bordeaux">RIEN</span>
    </div>
  );
}

export function Etiquette({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "bordeaux" }) {
  return (
    <span
      className={cn(
        "inline-block border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        ton === "bordeaux" ? "border-bordeaux text-bordeaux" : "border-rule-strong text-ink-3",
      )}
    >
      {children}
    </span>
  );
}
