import React, { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BookHeart,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Library,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { BookPlaceholder, cleanDescription } from "@/components/ReaderArt";
import { BookMascotArt, DripWave, SiteFooter, SunnyStickerBadge } from "@/components/NookDesign";
import { ReaderReceiptCard } from "@/components/ReaderReceiptCard";
import { defaultDescription, useBooks } from "@/context/BooksContext";
import { GENRE_OPTIONS, type Book, type Status } from "@/types/book";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Book Nook — Personal Reading Tracker" },
      {
        name: "description",
        content: "A playful personal dashboard for tracking books to read and books completed.",
      },
      { property: "og:title", content: "The Book Nook — Personal Reading Tracker" },
      {
        property: "og:description",
        content: "Keep your next great reads together in one bright, cozy corner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type MoodKey = "all" | "heart" | "cozy" | "thrill" | "classic";

const MOOD_GROUPS: Record<MoodKey, readonly string[]> = {
  all: [],
  heart: ["Romance", "Young Adult"],
  cozy: ["Cozy Fiction", "Literary Fiction", "Fiction"],
  thrill: ["Mystery & Thriller", "Sci-Fi & Fantasy"],
  classic: ["Classics", "Historical Fiction", "Memoir & Biography", "Self-Help", "Non-Fiction"],
};

function HomePage() {
  const {
    books,
    completed,
    reading,
    tbr,
    rhythm,
    currentBook,
    displayedUpNext,
    setHeroPickerMode,
    setModalOpen,
    setEditingBook,
    handleCompleteBook,
    openPdf,
    celebrating,
    addBook,
    chooseCurrentRead,
  } = useBooks();

  const navigate = useNavigate();

  // Interactive shelf breakdown tab ("What's on the Shelf" sunny yellow band)
  const [menuTab, setMenuTab] = useState<Status>("TBR");

  // Quick-add form state ("Craving a New Story?" cyan wave band)
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAuthor, setQuickAuthor] = useState("");
  const [quickStatus, setQuickStatus] = useState<Status>("TBR");
  const [quickGenre, setQuickGenre] = useState<string>("Fiction");

  // Interactive "Blind Date With Your TBR" surprise matcher state
  const [activeMood, setActiveMood] = useState<MoodKey>("all");
  const [mysteryMode, setMysteryMode] = useState(true);
  const [unwrapped, setUnwrapped] = useState(false);
  const [surpriseIndex, setSurpriseIndex] = useState(0);

  const unreadPool = useMemo(() => {
    const base = books.filter((b) => b.status === "TBR");
    const source = base.length > 0 ? base : books.filter((b) => b.status !== "Completed");
    if (activeMood === "all") return source;
    const allowed = MOOD_GROUPS[activeMood];
    return source.filter((b) => allowed.includes(b.genre || "Fiction"));
  }, [books, activeMood]);

  const surpriseBook = unreadPool.length > 0 ? unreadPool[surpriseIndex % unreadPool.length] : null;

  const spinSurpriseBook = () => {
    if (unreadPool.length === 0) return;
    setUnwrapped(!mysteryMode);
    if (unreadPool.length === 1) {
      setSurpriseIndex(0);
      return;
    }
    const currentIdx = surpriseIndex % unreadPool.length;
    const offset = 1 + Math.floor(Math.random() * (unreadPool.length - 1));
    setSurpriseIndex((currentIdx + offset) % unreadPool.length);
  };

  const shelfBreakdown = useMemo(() => {
    const filtered = books.filter((b) => b.status === menuTab);
    const counts = new Map<string, number>();
    for (const b of filtered) {
      const g = b.genre || "Fiction";
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [books, menuTab]);

  const handleQuickAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = quickTitle.trim();
    const author = quickAuthor.trim();
    if (!title || !author) return;

    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      cover: "",
      description: defaultDescription,
      status: quickStatus,
      addedAt: Date.now(),
      loading: true,
      hasPdf: false,
      pdfFileName: null,
      pdfFileSize: null,
      genre: quickGenre,
    };

    void addBook(newBook);
    setQuickTitle("");
    setQuickAuthor("");
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#FCFBF7] text-[#103A4E] selection:bg-[#FCE172] selection:text-[#103A4E] overflow-x-clip">
      {/* 1. CREAM SCALLOPED HEADER */}
      <SiteHeader activePage="home" />

      {/* 2. CORAL-ORANGE HERO SECTION (matching "Small Donuts, Big Flavor!") */}
      <section id="top" className="dds-hero-orange">
        <div className="dds-container relative z-10 pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Chunky White Fredoka Title, Dark Navy Subtitle, Navy Pill CTA */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="dds-hero-eyebrow mb-4">
                <Sparkles size={13} />
                <span>YOUR PERSONAL READING NOOK</span>
              </div>

              <h1 className="dds-hero-heading">
                Small Moments,
                <br />
                Big Stories!
              </h1>

              <p className="dds-hero-subcopy">
                Every plot twist, late-night chapter, and someday read—tucked neatly in one sunny
                corner.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-7">
                <Button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="dds-pill-btn dds-pill-navy dds-pill-lg"
                >
                  <span className="dds-pill-icon dds-pill-icon-orange">
                    <BookHeart size={15} />
                  </span>
                  <span className="dds-pill-copy">
                    <small>Track Every Chapter</small>
                    <strong>ADD A BOOK TO NOOK</strong>
                  </span>
                </Button>

                <Link to="/shelf" className="dds-hero-browse-text">
                  BROWSE MY SHELF <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right Column: Current Read Showcase + Tilted Sunny Yellow Sticker */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end pt-4 lg:pt-0">
              <div className="relative w-full max-w-[490px]">
                <SunnyStickerBadge topText={`${books.length}+`} bottomText="Stories to Love!" />

                <article className="dds-reading-showcase">
                  <div className="dds-reading-topbar">
                    <span className="dds-kicker-chip">
                      <BookOpen size={13} /> CURRENT READ
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setHeroPickerMode("current")}
                      className="dds-mini-navy-btn"
                    >
                      CHOOSE BOOK
                    </Button>
                  </div>

                  {currentBook ? (
                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-stretch">
                      {/* Book Cover */}
                      <div className="dds-showcase-cover">
                        {currentBook.cover && !currentBook.loading ? (
                          <img
                            src={currentBook.cover}
                            alt={`Cover of ${currentBook.title}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full ${
                            currentBook.cover && !currentBook.loading ? "hidden" : ""
                          }`}
                        >
                          <BookPlaceholder title={currentBook.title} />
                        </div>
                      </div>

                      {/* Book Metadata & Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between text-center sm:text-left">
                        <div>
                          <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[#4CC1D4] block mb-1">
                            ON YOUR NIGHTSTAND
                          </span>
                          <h2 className="font-display font-bold text-2xl text-[#103A4E] leading-tight break-words">
                            {currentBook.title}
                          </h2>
                          <p className="text-sm font-bold text-[#F47A3C] mt-0.5 mb-2">
                            by {currentBook.author}
                          </p>
                          {cleanDescription(currentBook.description) && (
                            <blockquote className="text-xs text-[#103A4E]/75 italic leading-relaxed border-l-2 border-[#4CC1D4] pl-2.5 line-clamp-2 mb-3 text-left">
                              “
                              {cleanDescription(currentBook.description)
                                .replace(/<[^>]*>/g, " ")
                                .slice(0, 96)
                                .trim()}
                              …”
                            </blockquote>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                          <Button
                            type="button"
                            onClick={() => handleCompleteBook(currentBook.id)}
                            className="dds-action-pill-teal"
                          >
                            <Check size={13} /> Mark completed
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingBook(currentBook)}
                            className="dds-action-pill-outline"
                          >
                            <BookOpen size={13} /> Details
                          </Button>
                          {currentBook.hasPdf && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => openPdf(currentBook.id)}
                              className="dds-action-pill-yellow"
                              title="Open PDF"
                            >
                              <FileText size={13} /> Read PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 px-4 text-center flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#4CC1D4]/20 text-[#103A4E] flex items-center justify-center mb-3">
                        <BookOpen size={26} />
                      </div>
                      <h3 className="font-display font-bold text-xl text-[#103A4E] mb-1">
                        What are you reading right now?
                      </h3>
                      <p className="text-xs text-[#103A4E]/70 max-w-xs mb-4">
                        Pick a title from your shelf to spotlight it right here.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setHeroPickerMode("current")}
                        className="dds-mini-navy-btn px-4 h-9"
                      >
                        Choose your current read <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </div>
                  )}

                  {celebrating === currentBook?.id && (
                    <div className="confetti" aria-hidden="true">
                      ✦ <span>♥</span> ★ <b>✦</b> ●
                    </div>
                  )}
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* Orange Frosting Drip Wave overlapping Cyan Story Band */}
        <DripWave fillColor="#F47A3C" bottomBgColor="#4DC4D8" variant="orange-to-cyan" />
      </section>

      {/* 3. BRIGHT CYAN STORY & STATS SECTION (matching "Serving Sweetness by the Dozen") */}
      <section className="dds-cyan-band">
        <div className="dds-container pt-4 pb-10 md:pt-6 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5 flex flex-col items-start">
              <h2 className="dds-cyan-heading">
                Serving Stories
                <br />
                by the Chapter
              </h2>

              <div className="dds-cyan-copy space-y-3 my-5">
                <p className="font-bold italic text-[#0E2F3F]">
                  The Book Nook is your cheerful literary hideout—built to turn every spare ten
                  minutes into a mini escape.
                </p>
                <p>
                  Keep your current nightstand pick front and center, line up your next three reads,
                  and never lose track of a book recommendation again.
                </p>
                <p>
                  Whether you breeze through weekend thrillers or savor quiet morning classics, your
                  entire library stays organized, searchable, and ready when you are.
                </p>
              </div>

              <Link to="/shelf" className="dds-pill-btn dds-pill-navy">
                <span className="dds-pill-icon dds-pill-icon-cyan">
                  <Library size={14} />
                </span>
                <span className="dds-pill-copy">
                  <small>TBR, Reading & Completed</small>
                  <strong>CHECK OUT MY SHELF</strong>
                </span>
              </Link>
            </div>

            {/* Right Showcase Window Card (matching the warm awning shack balance) */}
            <div className="lg:col-span-7">
              <div className="dds-nook-window">
                <div className="dds-nook-awning">
                  <span className="dds-awning-tag">THE BOOK NOOK · LIVE STATS</span>
                  <span className="dds-awning-pace">{rhythm}</span>
                </div>

                <div className="p-5 sm:p-6">
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
                    aria-label="Reading statistics"
                  >
                    <div className="dds-stat-tile">
                      <span className="dds-stat-badge bg-[#F47A3C]/15 text-[#F47A3C]">
                        <Library size={18} />
                      </span>
                      <strong>{books.length}</strong>
                      <span>Books In Nook</span>
                    </div>

                    <div className="dds-stat-tile">
                      <span className="dds-stat-badge bg-emerald-500/15 text-emerald-700">
                        <Check size={18} />
                      </span>
                      <strong>{completed}</strong>
                      <span>Stories Finished</span>
                    </div>

                    <div className="dds-stat-tile">
                      <span className="dds-stat-badge bg-[#FCE172]/55 text-[#8A6300]">
                        <Bookmark size={18} />
                      </span>
                      <strong>{tbr}</strong>
                      <span>On Your TBR</span>
                    </div>

                    <div className="dds-stat-tile">
                      <span className="dds-stat-badge bg-[#4DC4D8]/25 text-[#103A4E]">
                        <Sparkles size={18} />
                      </span>
                      <strong>{reading > 0 ? reading : currentBook ? 1 : 0}</strong>
                      <span>Reading Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cyan Frosting Drip Wave overlapping Warm White Showcase */}
        <DripWave fillColor="#4DC4D8" bottomBgColor="#FCFBF7" variant="cyan-to-cream" />
      </section>

      {/* 4. WARM WHITE UP NEXT SHOWCASE (matching "Meet the Donuts of Your Dreams") */}
      <section className="bg-[#FCFBF7] pt-8 pb-10">
        <div className="dds-container">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-[2.6rem] text-[#103A4E] tracking-tight leading-tight">
              Meet the Reads of Your Dreams
            </h2>
            <p className="text-sm sm:text-base text-[#103A4E]/70 font-semibold mt-1.5">
              Up Next on Your Nightstand — Pick 'Em Before Bedtime!
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => setHeroPickerMode("up-next")}
                className="dds-mini-navy-btn h-9 px-4"
              >
                Choose Up Next Books
              </Button>
              <Link
                to="/shelf"
                className="text-xs font-extrabold uppercase tracking-wider text-[#F47A3C] hover:text-[#103A4E] inline-flex items-center gap-1 transition-colors"
              >
                Full Bookshelf <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {displayedUpNext.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 max-w-5xl mx-auto">
              {displayedUpNext.map((b, i) => (
                <article
                  key={b.id}
                  onClick={() => setEditingBook(b)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEditingBook(b);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="dds-dream-card group cursor-pointer"
                >
                  <div className="dds-dream-image-box">
                    <span
                      className={`dds-dream-rank ${
                        i === 0
                          ? "bg-[#FCE172] text-[#103A4E]"
                          : i === 1
                            ? "bg-[#4DC4D8] text-[#103A4E]"
                            : "bg-[#F47A3C] text-white"
                      }`}
                    >
                      0{i + 1}
                    </span>

                    <div className="dds-dream-cover">
                      {b.cover && !b.loading ? (
                        <img
                          src={b.cover}
                          alt={`Cover of ${b.title}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full ${b.cover && !b.loading ? "hidden" : ""}`}>
                        <BookPlaceholder title={b.title} tone={i} />
                      </div>
                    </div>
                  </div>

                  <div className="dds-dream-info">
                    <div className="min-w-0">
                      <div className="flex sm:hidden items-center justify-between gap-2 mb-1">
                        <span className="text-[0.68rem] font-extrabold text-[#F47A3C] truncate">
                          by {b.author || "Unknown Author"}
                        </span>
                        {b.genre && <span className="genre-tag shrink-0">{b.genre}</span>}
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg sm:uppercase text-[#103A4E] group-hover:text-[#F47A3C] transition-colors leading-snug line-clamp-2 sm:line-clamp-1">
                        {b.title}
                      </h3>
                      <p className="hidden sm:block text-xs font-bold text-[#103A4E]/65 mt-0.5 truncate">
                        {b.author || "Unknown Author"}
                      </p>
                      {cleanDescription(b.description) && (
                        <p className="sm:hidden text-[0.72rem] text-[#103A4E]/70 line-clamp-2 mt-1 leading-snug">
                          {cleanDescription(b.description).replace(/<[^>]*>/g, " ")}
                        </p>
                      )}
                    </div>

                    <div className="sm:hidden flex items-center justify-between pt-2 mt-2 border-t border-[#f2ecdf]">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/60">
                        Up Next #{i + 1}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-[#103A4E]">
                        Details <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-[#EAE2D0] p-8 shadow-sm">
              <p className="text-sm font-semibold text-[#103A4E]/75 mb-4">
                Your Up Next queue is empty! Pick up to three books to stage right here.
              </p>
              <Button
                type="button"
                onClick={() => setHeroPickerMode("up-next")}
                className="dds-mini-navy-btn h-9 px-5"
              >
                Choose Queue Books
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Cream Wave into Sunny Yellow Shelf Breakdown Band */}
      <DripWave fillColor="#FCFBF7" bottomBgColor="#FCE172" variant="cream-to-yellow" />

      {/* 5. SUNNY YELLOW SHELF OVERVIEW BAND (matching "What's on the Menu") */}
      <section className="dds-yellow-band">
        <div className="dds-container pt-4 pb-10 md:pb-12">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#103A4E] tracking-tight">
              What's on Your Shelf
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#103A4E]/75 mt-1">
              Something Cozy, Something Thrilling, Something Unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto relative">
            {/* Left Side: Status Tabs + Cyan Round Badge + Button */}
            <div className="lg:col-span-5 relative">
              <div className="space-y-2 mb-6">
                {(
                  [
                    { key: "TBR", label: "To Be Read", count: tbr },
                    { key: "Reading", label: "Currently Reading", count: reading },
                    { key: "Completed", label: "Stories Completed", count: completed },
                  ] as const
                ).map((item) => {
                  const active = menuTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMenuTab(item.key)}
                      className={`dds-menu-tab-row ${active ? "is-active" : ""}`}
                    >
                      <span className="font-display font-bold text-base sm:text-lg text-[#103A4E] whitespace-nowrap">
                        {item.label}
                      </span>
                      <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-[#103A4E]/20 min-w-[12px] transition-all" />
                      <span className="text-xs font-extrabold text-[#103A4E]/70 mr-2 whitespace-nowrap">
                        {item.count}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          active ? "bg-[#113145] text-white" : "bg-white/60 text-[#103A4E]"
                        }`}
                      >
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <Link to="/shelf" className="dds-pill-btn dds-pill-navy">
                  <span className="dds-pill-icon dds-pill-icon-orange">
                    <BookOpen size={13} />
                  </span>
                  <span className="dds-pill-copy">
                    <small>Search & Filter</small>
                    <strong>OPEN MY SHELF</strong>
                  </span>
                </Link>

                {/* Cheerful cyan circle badge matching "Fresh Daily. Gone Quickly!" */}
                <div className="dds-cyan-circle-badge hidden sm:flex" aria-hidden="true">
                  <strong>Fresh Reads</strong>
                  <span>Added Daily!</span>
                </div>
              </div>
            </div>

            {/* Right Side: Signature Coral-Orange Box with Dotted Leaders + Book Mascot */}
            <div className="lg:col-span-7">
              <div className="dds-orange-menu-card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="font-display font-bold text-base sm:text-lg text-[#103A4E] uppercase">
                    {menuTab === "TBR"
                      ? "To Be Read Genres"
                      : menuTab === "Reading"
                        ? "Currently Reading"
                        : "Completed Classics & Favorites"}
                  </span>
                  <span className="text-xs font-extrabold bg-white/85 text-[#103A4E] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Top Genres
                  </span>
                </div>

                {shelfBreakdown.length > 0 ? (
                  <div className="space-y-2.5 mb-5">
                    {shelfBreakdown.map(([genre, count]) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => void navigate({ to: "/shelf" })}
                        className="dds-dotted-menu-row"
                      >
                        <span className="font-display font-bold text-sm sm:text-lg text-[#103A4E] truncate">
                          {genre}
                        </span>
                        <span className="dds-dotted-leader" aria-hidden="true" />
                        <span className="font-extrabold text-xs sm:text-sm text-[#103A4E] whitespace-nowrap shrink-0">
                          {count} {count === 1 ? "book" : "books"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-[#103A4E]/80 py-4">
                    No books in {menuTab} yet—add one below to fill this shelf!
                  </p>
                )}

                <div className="flex items-end justify-between gap-4 pt-2 border-t border-[#103A4E]/15">
                  <div className="text-xs font-bold text-[#103A4E] leading-relaxed">
                    <div className="uppercase tracking-wider opacity-75 mb-0.5">Library Totals</div>
                    <div>
                      All Stories: <strong>{books.length}</strong> · TBR: <strong>{tbr}</strong> ·
                      Done: <strong>{completed}</strong>
                    </div>
                  </div>
                  <BookMascotArt />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Yellow Wave into Cyan Quick-Add Band */}
        <DripWave fillColor="#FCE172" bottomBgColor="#4DC4D8" variant="yellow-to-cyan" />
      </section>

      {/* 6. BRIGHT CYAN QUICK-ADD BOOK SECTION (matching "Craving Donuts?" form band) */}
      <section className="dds-cyan-band relative overflow-hidden pt-4 pb-8">
        <div className="dds-doodle-pattern dds-doodle-cyan" aria-hidden="true" />

        <div className="dds-container relative z-10 pb-8">
          <div className="text-center max-w-xl mx-auto mb-7">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#103A4E] tracking-tight">
              Craving a New Story?
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#0E2F3F]/80 mt-1">
              Quick-add a book straight to your shelf — we'll look up its cover automatically!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleQuickAdd} className="dds-frosted-form-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="dds-quick-field">
                  <span>Book Title</span>
                  <Input
                    required
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g. Tomorrow, and Tomorrow..."
                    className="dds-quick-input"
                  />
                </label>

                <label className="dds-quick-field">
                  <span>Author</span>
                  <Input
                    required
                    value={quickAuthor}
                    onChange={(e) => setQuickAuthor(e.target.value)}
                    placeholder="e.g. Gabrielle Zevin"
                    className="dds-quick-input"
                  />
                </label>

                <label className="dds-quick-field">
                  <span>Shelf</span>
                  <select
                    value={quickStatus}
                    onChange={(e) => setQuickStatus(e.target.value as Status)}
                    className="dds-quick-select"
                  >
                    <option value="TBR">To Be Read</option>
                    <option value="Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <label className="dds-quick-field">
                  <span>Genre</span>
                  <select
                    value={quickGenre}
                    onChange={(e) => setQuickGenre(e.target.value)}
                    className="dds-quick-select"
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 pt-3 border-t border-[#103A4E]/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-xs font-extrabold text-[#103A4E] underline underline-offset-4 hover:text-[#F47A3C] cursor-pointer"
                >
                  Want to upload a custom cover or PDF? Open full form →
                </button>

                <Button type="submit" className="dds-mini-navy-btn px-6 h-10 w-full sm:w-auto">
                  + Tuck onto Shelf
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Cyan Drip Wave into Creative TBR Blind-Date Section */}
        <DripWave fillColor="#4DC4D8" bottomBgColor="#FCFBF7" variant="cyan-to-cream" />
      </section>

      {/* 7. CREATIVE SECTION: BLIND DATE WITH YOUR TBR */}
      <section className="bg-[#FCFBF7] pt-6 pb-14">
        <div className="dds-container">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="dds-kicker-chip mb-2.5">
              <Gift size={13} /> SERENDIPITY PICKER
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#103A4E] tracking-tight">
              Blind Date With Your TBR!
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#103A4E]/70 mt-1.5 leading-relaxed">
              Can't decide what to open next? Pick a mood, draw a surprise read from your unread
              shelf, and unwrap your next literary match.
            </p>
          </div>

          {/* Mood Filter Pills */}
          <div
            className="flex flex-wrap items-center justify-center gap-2 mb-7"
            role="group"
            aria-label="Filter surprise pick by reading mood"
          >
            {(
              [
                { key: "all", label: "✨ Any Mood" },
                { key: "heart", label: "💘 Heart-Flutter" },
                { key: "cozy", label: "☕ Warm & Cozy" },
                { key: "thrill", label: "🔍 Edge of Seat" },
                { key: "classic", label: "📖 True & Classic" },
              ] as const
            ).map((mood) => (
              <button
                key={mood.key}
                type="button"
                onClick={() => {
                  setActiveMood(mood.key);
                  setSurpriseIndex(0);
                  setUnwrapped(!mysteryMode);
                }}
                className={`dds-mood-pill ${activeMood === mood.key ? "is-active" : ""}`}
              >
                {mood.label}
              </button>
            ))}
          </div>

          {/* Ticket / Mystery Parcel Card */}
          <div className="max-w-4xl mx-auto dds-blind-date-shell">
            <div className="dds-blind-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCE172] text-[#103A4E] text-xs font-extrabold mb-3">
                  <span>{unreadPool.length} Unread Matches</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-[#103A4E] leading-tight">
                  Spin for a Surprise Story
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#103A4E]/75 mt-2 leading-relaxed">
                  Keep Mystery Mode on to judge purely by vibe and blurb before peeking at the
                  cover.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-5">
                <Button
                  type="button"
                  onClick={spinSurpriseBook}
                  disabled={unreadPool.length === 0}
                  className="dds-spin-cta"
                >
                  <Shuffle size={15} /> Spin a New Match
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !mysteryMode;
                    setMysteryMode(next);
                    setUnwrapped(!next);
                  }}
                  className="dds-mystery-toggle"
                >
                  {mysteryMode ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>Mystery Wrap: {mysteryMode ? "ON" : "OFF"}</span>
                </button>
              </div>
            </div>

            <div className="dds-blind-right">
              {!surpriseBook ? (
                <div className="text-center py-6 px-3">
                  <p className="font-display font-bold text-lg text-[#103A4E] mb-1">
                    No unread books in this mood yet
                  </p>
                  <p className="text-xs font-semibold text-[#103A4E]/70 mb-4">
                    Try choosing “Any Mood” or add a new story above.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setActiveMood("all")}
                    className="dds-mini-navy-btn h-9 px-4"
                  >
                    Show Any Mood
                  </Button>
                </div>
              ) : mysteryMode && !unwrapped ? (
                <div className="dds-wrapped-parcel">
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#103A4E] text-[0.7rem] font-extrabold uppercase tracking-wider border border-[#103A4E]/15 shadow-xs mb-3">
                      <Gift size={12} className="text-[#F47A3C]" /> Secret TBR Match ·{" "}
                      {surpriseBook.genre || "Fiction"}
                    </span>

                    <p className="font-display font-bold text-xl sm:text-2xl text-[#103A4E] mb-2">
                      Wrapped & Ready to Read
                    </p>

                    <p className="text-xs sm:text-sm font-semibold text-[#103A4E]/80 max-w-md italic leading-relaxed mb-5">
                      {cleanDescription(surpriseBook.description)
                        ? `“${cleanDescription(surpriseBook.description)
                            .replace(/<[^>]*>/g, " ")
                            .slice(0, 130)
                            .trim()}…”`
                        : `A mystery ${surpriseBook.genre || "story"} waiting quietly on your shelf—clue: written by ${surpriseBook.author
                            .split(" ")
                            .map((w) => `${w[0]}.`)
                            .join(" ")}`}
                    </p>

                    <Button
                      type="button"
                      onClick={() => setUnwrapped(true)}
                      className="dds-mini-navy-btn h-10 px-6"
                    >
                      Unwrap This Book ✨
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-stretch w-full">
                  <div className="dds-blind-cover">
                    {surpriseBook.cover && !surpriseBook.loading ? (
                      <img
                        src={surpriseBook.cover}
                        alt={`Cover of ${surpriseBook.title}`}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full ${
                        surpriseBook.cover && !surpriseBook.loading ? "hidden" : ""
                      }`}
                    >
                      <BookPlaceholder title={surpriseBook.title} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between text-center sm:text-left">
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                        <span className="genre-tag">{surpriseBook.genre || "Fiction"}</span>
                        <span className="text-[0.66rem] font-extrabold uppercase tracking-wider text-[#0F766E]">
                          Surprise Match
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-[#103A4E] leading-tight break-words">
                        {surpriseBook.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-[#F47A3C] mt-0.5 mb-2">
                        by {surpriseBook.author}
                      </p>
                      {cleanDescription(surpriseBook.description) && (
                        <p className="text-xs text-[#103A4E]/75 line-clamp-2 leading-relaxed mb-3">
                          {cleanDescription(surpriseBook.description).replace(/<[^>]*>/g, " ")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                      <Button
                        type="button"
                        onClick={() => chooseCurrentRead(surpriseBook)}
                        className="dds-action-pill-teal"
                      >
                        <BookOpen size={13} /> Read This Now
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingBook(surpriseBook)}
                        className="dds-action-pill-outline"
                      >
                        Details
                      </Button>
                      {mysteryMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setUnwrapped(false)}
                          className="dds-action-pill-yellow"
                        >
                          Re-wrap
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cream Drip Wave into Reader DNA Diner Receipt */}
      <DripWave fillColor="#FCFBF7" bottomBgColor="#FCE172" variant="cream-to-yellow" />

      {/* 8. CREATIVE FEATURE: PERSONALIZED BOOK NOOK DINER RECEIPT */}
      <ReaderReceiptCard />

      {/* Yellow Drip Wave into Framed Cream Footer */}
      <DripWave fillColor="#FCE172" bottomBgColor="#FAF5E8" variant="yellow-to-cyan" />

      {/* 9. FRAMED CREAM FOOTER */}
      <SiteFooter />
    </main>
  );
}
