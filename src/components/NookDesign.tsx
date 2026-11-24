import React from "react";
import { Link } from "@tanstack/react-router";
import { BookHeart, BookOpen, Plus } from "lucide-react";
import { useBooks } from "@/context/BooksContext";
import { Button } from "@/components/ui/button";

/**
 * Stacked bubbly retro badge logo inspired by the Dinky Donut Shack mark:
 * chunky Fredoka uppercase letters, slight playful tilt, navy stroke & bright cyan shadow.
 */
export function NookStackedLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scaleClass = size === "sm" ? "scale-90" : size === "lg" ? "scale-110" : "scale-100";

  return (
    <span className={`dds-stacked-logo ${scaleClass}`} aria-hidden="true">
      <span className="dds-logo-line dds-logo-line-1">THE</span>
      <span className="dds-logo-line dds-logo-line-2">
        BOOK <span className="dds-logo-dot">✦</span>
      </span>
      <span className="dds-logo-line dds-logo-line-3">NOOK</span>
    </span>
  );
}

/**
 * Gentle cream cloud scallop attached below the sticky header.
 */
export function HeaderScallop() {
  return (
    <div className="dds-header-scallop" aria-hidden="true">
      <svg
        viewBox="0 0 1440 36"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-[18px] md:h-[26px]"
      >
        <path
          d="M0,0 L1440,0 L1440,12 C1400,24 1355,24 1315,10 C1275,24 1230,24 1190,11 C1150,25 1105,25 1065,12 C1025,25 980,25 940,11 C900,25 855,25 815,14 C775,33 665,33 625,14 C585,25 540,25 500,11 C460,25 415,25 375,12 C335,25 290,25 250,11 C210,24 165,24 125,10 C85,24 40,24 0,12 Z"
          fill="#FAF5E8"
        />
      </svg>
    </div>
  );
}

/**
 * Organic frosting/glaze drip wave divider.
 * Place at the bottom of `topColor` section overlapping into `bottomColor` section.
 */
export function DripWave({
  fillColor,
  bottomBgColor,
  variant = "orange-to-cyan",
}: {
  fillColor: string;
  bottomBgColor: string;
  variant?: "orange-to-cyan" | "cyan-to-cream" | "cream-to-yellow" | "yellow-to-cyan";
}) {
  const path =
    variant === "orange-to-cyan"
      ? "M0,0 L1440,0 L1440,30 C1405,30 1392,76 1352,76 C1314,76 1300,26 1258,26 C1218,26 1200,92 1152,92 C1106,92 1094,34 1050,34 C1006,34 994,64 952,64 C908,64 892,108 842,108 C794,108 782,36 734,36 C688,36 672,118 618,118 C568,118 556,42 512,42 C466,42 452,88 402,88 C356,88 342,30 296,30 C252,30 238,104 188,104 C138,104 124,42 78,42 C38,42 22,74 0,68 Z"
      : variant === "cyan-to-cream"
        ? "M0,0 L1440,0 L1440,36 C1398,36 1384,96 1334,96 C1288,96 1272,30 1224,30 C1178,30 1164,78 1118,78 C1070,78 1054,116 1002,116 C952,116 938,40 890,40 C844,40 830,86 782,86 C734,86 718,26 670,26 C622,26 606,106 554,106 C504,106 490,44 442,44 C394,44 378,94 328,94 C280,94 266,28 218,28 C170,28 154,112 102,112 C56,112 32,46 0,40 Z"
        : variant === "cream-to-yellow"
          ? "M0,0 L1440,0 L1440,28 C1390,28 1365,78 1310,78 C1255,78 1235,28 1175,28 C1115,28 1090,88 1030,88 C970,88 945,32 885,32 C825,32 800,82 740,82 C680,82 655,24 595,24 C535,24 510,92 450,92 C390,92 365,36 305,36 C245,36 220,76 160,76 C100,76 65,28 0,32 Z"
          : "M0,0 L1440,0 L1440,32 C1395,32 1382,88 1336,88 C1292,88 1278,34 1230,34 C1184,34 1168,104 1118,104 C1070,104 1056,40 1008,40 C962,40 946,76 900,76 C852,76 838,26 788,26 C740,26 724,110 672,110 C622,110 608,38 560,38 C514,38 498,84 452,84 C404,84 390,30 342,30 C294,30 278,98 228,98 C178,98 164,38 116,38 C72,38 42,74 0,60 Z";

  return (
    <div
      className="w-full overflow-hidden leading-none select-none relative z-10"
      style={{ backgroundColor: bottomBgColor, marginTop: "-1px" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 130"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block w-full h-[64px] sm:h-[82px] md:h-[104px]"
        style={{ transform: "translateY(-1px)" }}
      >
        <path d={path} fill={fillColor} />
      </svg>
    </div>
  );
}

/**
 * Sunny scalloped yellow sticker badge ("30+ Flavours to Love!" -> "{count}+ Stories to Love!")
 */
export function SunnyStickerBadge({
  topText,
  bottomText,
  className = "",
}: {
  topText: string;
  bottomText: string;
  className?: string;
}) {
  return (
    <div className={`dds-sunny-sticker ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
        <path
          d="M60 4 C68 4 72 10 80 8 C88 6 94 12 99 18 C105 23 111 27 111 35 C111 43 117 48 115 56 C113 64 118 71 114 78 C110 86 111 94 104 99 C97 104 94 112 85 112 C77 112 71 117 63 115 C55 113 48 118 41 114 C33 110 26 112 20 105 C14 98 7 95 7 86 C7 78 2 72 4 64 C6 56 2 49 6 42 C10 34 9 26 16 21 C23 16 26 8 35 8 C43 8 52 4 60 4 Z"
          fill="#FCE172"
          stroke="#103A4E"
          strokeWidth="2.5"
        />
      </svg>
      <div className="dds-sunny-sticker-text">
        <strong>{topText}</strong>
        <span>{bottomText}</span>
      </div>
    </div>
  );
}

/**
 * Cartoon dancing book mascot matching the cheerful donut doodle inside the orange menu box.
 */
export function BookMascotArt({ className = "w-16 h-16 sm:w-24 sm:h-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`${className} shrink-0 select-none`} aria-hidden="true">
      {/* Arms */}
      <path
        d="M32 62 C18 58 14 44 20 36"
        fill="none"
        stroke="#103A4E"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M88 62 C102 58 106 44 100 36"
        fill="none"
        stroke="#103A4E"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Legs */}
      <path
        d="M48 92 L44 108 L36 108"
        fill="none"
        stroke="#103A4E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72 92 L78 108 L86 108"
        fill="none"
        stroke="#103A4E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Book body */}
      <rect
        x="30"
        y="26"
        width="60"
        height="68"
        rx="10"
        fill="#FCE172"
        stroke="#103A4E"
        strokeWidth="3.5"
      />
      {/* Spine */}
      <line x1="40" y1="26" x2="40" y2="94" stroke="#103A4E" strokeWidth="3" />
      {/* Bookmark ribbon */}
      <path
        d="M72 26 L72 44 L78 39 L84 44 L84 26 Z"
        fill="#4CC1D4"
        stroke="#103A4E"
        strokeWidth="2.5"
      />
      {/* Cute face */}
      <circle cx="55" cy="56" r="3" fill="#103A4E" />
      <circle cx="75" cy="56" r="3" fill="#103A4E" />
      <path
        d="M57 67 Q65 75 73 67"
        fill="none"
        stroke="#103A4E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Rosy cheeks */}
      <circle cx="49" cy="63" r="3.5" fill="#F47A3C" opacity="0.55" />
      <circle cx="81" cy="63" r="3.5" fill="#F47A3C" opacity="0.55" />
    </svg>
  );
}

/**
 * Framed cream footer matching the bottom of the Dinky Donut Shack template:
 * thin coral-orange rounded box, centered stacked logo overlapping top edge,
 * columns for nav links, reading stats, and two navy pill buttons.
 */
export function SiteFooter() {
  const { books, completed, setModalOpen } = useBooks();

  return (
    <footer className="dds-site-footer">
      <div className="dds-container">
        <div className="dds-footer-frame">
          {/* Logo breaking top border */}
          <div className="dds-footer-logo-badge">
            <Link to="/" aria-label="The Book Nook home" className="inline-flex items-center">
              <NookStackedLogo size="md" />
            </Link>
          </div>

          <div className="dds-footer-grid">
            {/* Column 1: Nav links */}
            <div className="dds-footer-col dds-footer-nav-col">
              <Link to="/" className="dds-footer-link">
                HOME
              </Link>
              <Link to="/shelf" className="dds-footer-link">
                MY SHELF
              </Link>
              <a href="#top" className="dds-footer-link">
                BACK TO TOP ↑
              </a>
            </div>

            {/* Column 2: Reading Summary */}
            <div className="dds-footer-col dds-footer-meta">
              <div className="dds-footer-meta-item">
                <span className="dds-footer-icon">📚</span>
                <div>
                  <strong>{books.length} Books in Nook</strong>
                  <small>{completed} Stories Completed</small>
                </div>
              </div>
              <div className="dds-footer-meta-item">
                <span className="dds-footer-icon">☕</span>
                <div>
                  <strong>Cozy Reading Pace</strong>
                  <small>Slow mornings & late nights</small>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Note */}
            <div className="dds-footer-col dds-footer-meta">
              <div className="dds-footer-meta-item">
                <span className="dds-footer-icon">✨</span>
                <div>
                  <strong>Always Saved Locally</strong>
                  <small>Your covers, notes & PDFs</small>
                </div>
              </div>
            </div>

            {/* Column 4: Two Navy Pill CTAs */}
            <div className="dds-footer-actions">
              <Link to="/shelf" className="dds-pill-btn dds-pill-navy">
                <span className="dds-pill-icon">
                  <BookOpen size={13} />
                </span>
                <span className="dds-pill-copy">
                  <small>All {books.length} Books</small>
                  <strong>VIEW SHELF</strong>
                </span>
              </Link>

              <Button
                type="button"
                onClick={() => setModalOpen(true)}
                className="dds-pill-btn dds-pill-navy"
              >
                <span className="dds-pill-icon">
                  <Plus size={13} />
                </span>
                <span className="dds-pill-copy">
                  <small>Track a Story</small>
                  <strong>ADD A BOOK</strong>
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="dds-footer-bottom">
          <p>
            © {new Date().getFullYear()} The Book Nook · Made for cozy readers and very full
            shelves.
          </p>
          <a href="#top" aria-label="Scroll back to top" className="dds-scroll-top-circle">
            <BookHeart size={15} />
          </a>
        </div>
      </div>
    </footer>
  );
}
