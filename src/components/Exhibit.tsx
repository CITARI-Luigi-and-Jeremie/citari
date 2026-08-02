import { useEffect, useState } from "react";

export function Exhibit() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const mark = `highlight-signal not-italic${on ? " highlight-signal-on" : ""}`;

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="border border-rule-strong bg-paper-2 p-6 sm:p-10">
          <p className="mono text-[13px] uppercase tracking-[0.08em] text-ink-2">
            Extrait d'un scan — question 7/24
          </p>
          <blockquote className="quote-serif measure mt-6 text-[24px] leading-[1.45] sm:text-[28px]">
            « Pour un cabinet fiable à Lyon, je recommande plutôt{" "}
            <span className={mark}>Concurrent A</span> ou{" "}
            <span className={mark}>Concurrent B</span>. »
          </blockquote>
          <p className="mono mt-6 text-[13px] text-ink-2">
            — ChatGPT, interrogé le 02/08/2026
          </p>
        </div>
        <p className="measure mt-6 text-ink-2">
          C'est ce genre de phrase que le scan retrouve, pour votre marché et votre ville.
        </p>
      </div>
    </section>
  );
}
