import React, { useMemo, useState } from "react";
import { Check, Copy, Download, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBooks } from "@/context/BooksContext";

type TicketPaper = "ivory" | "sunny" | "coastal";

type PersonaInfo = {
  badge: string;
  title: string;
  tagline: string;
};

function computePersona(topGenre: string, completedCount: number, totalCount: number): PersonaInfo {
  if (totalCount === 0) {
    return {
      badge: "✨ Blank Page",
      title: "Story Collector in the Making",
      tagline: "Add your first few books to print your personalized reader profile.",
    };
  }

  switch (topGenre) {
    case "Romance":
    case "Young Adult":
      return {
        badge: "💘 Heart-Flutter Regular",
        title: "Hopeless Chapter Romantic",
        tagline: "Always ordering slow-burn banter with an extra shot of happy endings.",
      };
    case "Mystery & Thriller":
      return {
        badge: "🔍 Late-Night Sleuth",
        title: "Midnight Twist Chaser",
        tagline: "Turns just-one-more-chapter into 2:00 AM plot-twist marathons.",
      };
    case "Cozy Fiction":
    case "Literary Fiction":
      return {
        badge: "☕ Bookshop Regular",
        title: "Rainy-Day Soul Reader",
        tagline: "Savors quiet mornings, rich prose, and stories that feel like home.",
      };
    case "Sci-Fi & Fantasy":
      return {
        badge: "🪐 Realm Hopper",
        title: "Cosmic World Traveler",
        tagline: "Collected worlds, magic systems, and faraway galaxies on tap.",
      };
    case "Classics":
    case "Historical Fiction":
      return {
        badge: "🏛️ Time Traveler",
        title: "Timeless Story Archivist",
        tagline: "Curates enduring tales, gilded eras, and unforgettable characters.",
      };
    default:
      if (completedCount >= Math.max(5, Math.floor(totalCount * 0.4))) {
        return {
          badge: "⚡ Serial Finisher",
          title: "Unstoppable Page Turner",
          tagline: "Devours every mood on the menu—from crisp memoirs to modern fiction.",
        };
      }
      return {
        badge: "✨ Eclectic Reader",
        title: "All-Season Story Connoisseur",
        tagline: "Samples every shelf generously with an ever-growing nightstand stack.",
      };
  }
}

function SawtoothEdge({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 360 14"
      preserveAspectRatio="none"
      className={`block w-full h-[12px] ${flip ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M0,14 L0,8 L9,0 L18,8 L27,0 L36,8 L45,0 L54,8 L63,0 L72,8 L81,0 L90,8 L99,0 L108,8 L117,0 L126,8 L135,0 L144,8 L153,0 L162,8 L171,0 L180,8 L189,0 L198,8 L207,0 L216,8 L225,0 L234,8 L243,0 L252,8 L261,0 L270,8 L279,0 L288,8 L297,0 L306,8 L315,0 L324,8 L333,0 L342,8 L351,0 L360,8 L360,14 Z"
        fill={fill}
      />
    </svg>
  );
}

const PAPER_THEMES: Record<TicketPaper, { label: string; bg: string; accent: string }> = {
  ivory: { label: "Classic Ivory", bg: "#FFFDF9", accent: "#F47A3C" },
  sunny: { label: "Sunny Paper", bg: "#FFF6D1", accent: "#103A4E" },
  coastal: { label: "Coastal Mint", bg: "#ECFAFD", accent: "#103A4E" },
};

export function ReaderReceiptCard() {
  const { books, completed, tbr, currentBook, rhythm } = useBooks();
  const [paper, setPaper] = useState<TicketPaper>("ivory");
  const [copied, setCopied] = useState(false);

  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) {
      const g = book.genre || "Fiction";
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [books]);

  const topGenreName = topGenres[0]?.[0] ?? "Fiction";
  const persona = useMemo(
    () => computePersona(topGenreName, completed, books.length),
    [topGenreName, completed, books.length],
  );
  const completionPct = books.length > 0 ? Math.round((completed / books.length) * 100) : 0;

  const activePaper = PAPER_THEMES[paper];

  const handleCopyText = async () => {
    const lines = [
      "===== THE BOOK NOOK RECEIPT =====",
      `READER VIBE : ${persona.title}`,
      `CURRENTLY   : ${currentBook ? `${currentBook.title} (${currentBook.author})` : "Choosing next read"}`,
      "---------------------------------",
      ...topGenres.map(([g, count]) => `${String(count).padStart(2, "0")}x  ${g.toUpperCase()}`),
      "---------------------------------",
      `TOTAL BOOKS : ${books.length}`,
      `COMPLETED   : ${completed} (${completionPct}%)`,
      `ON TBR      : ${tbr}`,
      "★ THANK YOU FOR READING ★",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Receipt copied to clipboard!");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy automatically", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const handleDownloadPng = () => {
    try {
      const width = 680;
      const height = 840;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Yellow outer card backdrop
      ctx.fillStyle = "#FCE172";
      ctx.fillRect(0, 0, width, height);

      // Paper sheet
      ctx.fillStyle = activePaper.bg;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(60, 48, width - 120, height - 96, 24);
      } else {
        ctx.rect(60, 48, width - 120, height - 96);
      }
      ctx.fill();
      ctx.strokeStyle = "#103A4E";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#103A4E";
      ctx.textAlign = "center";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("THE BOOK NOOK", width / 2, 118);

      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#466575";
      ctx.fillText(
        `ORDER #${String(books.length).padStart(4, "0")}  ·  ${rhythm}% RHYTHM`,
        width / 2,
        148,
      );

      // Divider
      ctx.strokeStyle = "rgba(16, 58, 78, 0.25)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(96, 178);
      ctx.lineTo(width - 96, 178);
      ctx.stroke();

      // Persona
      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.fillStyle = "#F47A3C";
      ctx.font = "bold 15px monospace";
      ctx.fillText("READER ARCHETYPE", 98, 214);

      ctx.fillStyle = "#103A4E";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(persona.title, 98, 246);

      ctx.fillStyle = "#466575";
      ctx.font = "bold 15px monospace";
      ctx.fillText("NOW ON NIGHTSTAND", 98, 294);
      ctx.fillStyle = "#103A4E";
      ctx.font = "bold 19px sans-serif";
      const curText = currentBook ? currentBook.title.slice(0, 34) : "Ready to choose next book";
      ctx.fillText(curText, 98, 322);

      // Top genres list
      ctx.strokeStyle = "rgba(16, 58, 78, 0.22)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(96, 352);
      ctx.lineTo(width - 96, 352);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#466575";
      ctx.font = "bold 15px monospace";
      ctx.fillText("TOP FLAVORS ORDERED", 98, 386);

      let y = 424;
      for (const [genre, count] of topGenres) {
        ctx.fillStyle = "#103A4E";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${String(count).padStart(2, "0")}x  ${genre.toUpperCase()}`, 98, y);
        ctx.textAlign = "right";
        ctx.fillStyle = "#F47A3C";
        ctx.fillText(`${count} bks`, width - 98, y);
        y += 38;
      }

      // Totals
      ctx.strokeStyle = "rgba(16, 58, 78, 0.25)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(96, 594);
      ctx.lineTo(width - 96, 594);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.fillStyle = "#103A4E";
      ctx.font = "bold 18px monospace";
      ctx.fillText("BOOKS IN NOOK", 98, 634);
      ctx.fillText("STORIES FINISHED", 98, 668);
      ctx.fillText("ON YOUR TBR", 98, 702);

      ctx.textAlign = "right";
      ctx.fillText(String(books.length), width - 98, 634);
      ctx.fillText(`${completed} (${completionPct}%)`, width - 98, 668);
      ctx.fillText(String(tbr), width - 98, 702);

      ctx.textAlign = "center";
      ctx.fillStyle = "#4DC4D8";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("★ THANK YOU FOR READING ★", width / 2, 758);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "the-book-nook-receipt.png";
      a.click();
      toast.success("Keepsake receipt PNG saved!");
    } catch {
      toast.error("Couldn't generate PNG", {
        description: "Please try the Copy to Share button instead.",
      });
    }
  };

  return (
    <section className="dds-yellow-band pt-6 pb-10 md:pb-12">
      <div className="dds-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center max-w-5xl mx-auto">
          {/* Left Column: Reader Personality & Controls */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="dds-kicker-chip bg-white/85 mb-3">
              <Receipt size={13} className="text-[#F47A3C]" /> LIVE READER DNA
            </span>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#103A4E] tracking-tight leading-tight">
              Your Book Nook Receipt
            </h2>

            <p className="text-xs sm:text-sm font-bold text-[#103A4E]/75 mt-2 leading-relaxed">
              Inspired by classic corner bakery tickets—freshly tallied from your real reading
              shelf, favorite genres, and finished pace.
            </p>

            {/* Persona Highlight Card */}
            <div className="w-full mt-5 p-4 sm:p-5 rounded-3xl bg-white/85 border border-[#103A4E]/12 shadow-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4DC4D8]/25 text-[#103A4E] text-xs font-extrabold mb-2">
                <Sparkles size={12} className="text-[#F47A3C]" /> {persona.badge}
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#103A4E]">
                {persona.title}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#103A4E]/75 mt-1 leading-relaxed">
                {persona.tagline}
              </p>
            </div>

            {/* Paper Style Switcher */}
            <div className="mt-5 w-full">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/70 block mb-2">
                Ticket Paper Style
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PAPER_THEMES) as TicketPaper[]).map((key) => {
                  const item = PAPER_THEMES[key];
                  const active = paper === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaper(key)}
                      className={`dds-mood-pill ${active ? "is-active" : ""}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 w-full sm:w-auto">
              <Button
                type="button"
                onClick={handleDownloadPng}
                className="dds-mini-navy-btn h-10 px-5 flex-1 sm:flex-initial"
              >
                <Download size={14} className="mr-1.5" /> Save Keepsake PNG
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleCopyText()}
                className="h-10 px-4 rounded-full border border-[#103A4E]/20 bg-white hover:bg-[#DFF5F9] text-[#103A4E] font-extrabold text-xs flex-1 sm:flex-initial"
              >
                {copied ? (
                  <Check size={14} className="mr-1.5" />
                ) : (
                  <Copy size={14} className="mr-1.5" />
                )}
                {copied ? "Copied!" : "Copy Text"}
              </Button>
            </div>
          </div>

          {/* Right Column: Scalloped Diner Receipt Ticket */}
          <div className="lg:col-span-6 flex justify-center">
            <article
              className="dds-receipt-ticket w-full max-w-[400px]"
              aria-label="Reader receipt"
            >
              <SawtoothEdge fill={activePaper.bg} />
              <div className="dds-receipt-body" style={{ backgroundColor: activePaper.bg }}>
                <div className="text-center pb-3 border-b-2 border-dashed border-[#103A4E]/20">
                  <strong className="font-display text-xl tracking-tight text-[#103A4E] block">
                    THE BOOK NOOK
                  </strong>
                  <span className="dds-receipt-mono text-[0.68rem] text-[#466575] uppercase">
                    ORDER #{String(books.length).padStart(4, "0")} · {rhythm}% RHYTHM
                  </span>
                </div>

                <div className="py-3 border-b-2 border-dashed border-[#103A4E]/20 space-y-2">
                  <div>
                    <span className="dds-receipt-mono text-[0.65rem] text-[#F47A3C] font-bold block">
                      CUSTOMER PROFILE
                    </span>
                    <strong className="font-display text-base text-[#103A4E]">
                      {persona.title}
                    </strong>
                  </div>
                  <div>
                    <span className="dds-receipt-mono text-[0.65rem] text-[#466575] font-bold block">
                      NOW ON NIGHTSTAND
                    </span>
                    <span className="text-sm font-extrabold text-[#103A4E] line-clamp-1">
                      {currentBook ? currentBook.title : "Ready to pick next read"}
                    </span>
                  </div>
                </div>

                <div className="py-3 border-b-2 border-dashed border-[#103A4E]/20">
                  <span className="dds-receipt-mono text-[0.65rem] text-[#466575] font-bold block mb-2">
                    TOP FLAVORS ORDERED
                  </span>
                  {topGenres.length > 0 ? (
                    <div className="space-y-1.5">
                      {topGenres.map(([genre, count]) => (
                        <div
                          key={genre}
                          className="dds-receipt-mono flex items-baseline gap-2 text-xs text-[#103A4E]"
                        >
                          <span className="font-bold shrink-0">
                            {String(count).padStart(2, "0")}x
                          </span>
                          <span className="truncate font-bold uppercase">{genre}</span>
                          <span className="flex-1 border-b border-dotted border-[#103A4E]/35 min-w-[14px]" />
                          <span
                            className="font-bold shrink-0"
                            style={{ color: activePaper.accent }}
                          >
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="dds-receipt-mono text-xs text-[#466575]">00x EMPTY SHELF</span>
                  )}
                </div>

                <div className="py-3 space-y-1 dds-receipt-mono text-xs text-[#103A4E]">
                  <div className="flex justify-between font-bold">
                    <span>BOOKS IN NOOK</span>
                    <span>{books.length}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>STORIES FINISHED</span>
                    <span>
                      {completed} ({completionPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>STILL ON TBR</span>
                    <span>{tbr}</span>
                  </div>
                </div>

                {/* Barcode & Stamp */}
                <div className="pt-3 border-t-2 border-dashed border-[#103A4E]/20 text-center">
                  <div className="dds-receipt-barcode mx-auto mb-2" aria-hidden="true">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: i % 3 === 0 ? "3px" : i % 2 === 0 ? "2px" : "1.5px",
                          opacity: i % 5 === 0 ? 0.55 : 0.88,
                        }}
                      />
                    ))}
                  </div>
                  <span className="dds-receipt-mono text-[0.68rem] font-bold tracking-widest text-[#103A4E]">
                    ★ THANK YOU FOR READING ★
                  </span>
                </div>
              </div>
              <SawtoothEdge fill={activePaper.bg} flip />
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
