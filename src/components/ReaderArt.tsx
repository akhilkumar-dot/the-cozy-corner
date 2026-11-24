export function cleanDescription(desc?: string | null): string {
  if (!desc) return "";
  if (desc.includes("A story waiting for its turn on the shelf")) return "";
  return desc.trim();
}

export function ReaderIllustration({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 260 300" aria-hidden="true" className={`reader-art reader-art-${side}`}>
      <path
        className="fill-cloud"
        d="M20 262c-12-39 8-76 39-89 4-51 42-90 91-90 50 0 91 43 91 96 20 16 27 47 13 83H20Z"
      />
      <circle className="fill-skin" cx={side === "left" ? 126 : 134} cy="85" r="35" />
      <path
        className="fill-ink"
        d={
          side === "left"
            ? "M94 85c3-48 66-58 75-5-16-2-29-10-36-24-5 20-19 29-39 29Z"
            : "M99 86c0-52 68-58 75-4-17 1-33-9-39-25-5 19-17 28-36 29Z"
        }
      />
      <path
        className={side === "left" ? "fill-mint" : "fill-coral"}
        d="M65 260c3-77 22-127 65-127 48 0 70 47 72 127H65Z"
      />
      <path
        className="fill-skin"
        d={
          side === "left"
            ? "M92 151c17 15 28 32 34 52l-20 8c-12-19-24-35-36-44Z"
            : "M170 150c-18 14-30 33-36 54l21 8c11-20 23-36 36-45Z"
        }
      />
      <path
        className="fill-book"
        d={side === "left" ? "M112 172l69-13 10 70-70 12Z" : "M70 160l76 13-11 68-74-14Z"}
      />
      <path
        className="stroke-ink"
        d={side === "left" ? "M151 168l8 65" : "M108 168l-10 64"}
        fill="none"
        strokeWidth="3"
      />
      <circle className="fill-ink" cx={side === "left" ? 140 : 122} cy="87" r="3" />
      <path
        className="stroke-ink"
        d={side === "left" ? "M139 101q10 7 18-1" : "M103 101q10 7 18-1"}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BookPlaceholder({ title, tone = 0 }: { title: string; tone?: number }) {
  const tones = ["bg-sky", "bg-yellow", "bg-mint", "bg-coral-soft", "bg-cream"];
  return (
    <div className={`book-placeholder ${tones[tone % tones.length]}`}>
      <svg viewBox="0 0 140 110" aria-hidden="true" className="w-4/5 max-w-36">
        <path
          className="fill-cream stroke-ink"
          strokeWidth="3"
          d="M19 72l52 14 51-14v25L71 108 19 96Z"
        />
        <path
          className="fill-coral stroke-ink"
          strokeWidth="3"
          d="M24 48l47 13 43-15v27L71 87 24 74Z"
        />
        <path
          className="fill-yellow stroke-ink"
          strokeWidth="3"
          d="M32 25l41 13 35-13v23L72 61 32 49Z"
        />
        <path className="fill-ink" d="M65 12h15v28H65z" />
        <path className="fill-coral" d="M80 12l12 8-12 8Z" />
      </svg>
      <span>{title}</span>
    </div>
  );
}
