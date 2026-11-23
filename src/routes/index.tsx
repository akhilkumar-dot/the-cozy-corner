import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BookHeart,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Library,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { BookPlaceholder, cleanDescription } from "@/components/ReaderArt";
import { useBooks } from "@/context/BooksContext";

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

function HomePage() {
  const {
    books,
    completed,
    reading,
    tbr,
    currentBook,
    displayedUpNext,
    setHeroPickerMode,
    setModalOpen,
    setEditingBook,
    handleCompleteBook,
    openPdf,
    celebrating,
  } = useBooks();

  return (
    <main className="min-h-screen bg-violet text-ink flex flex-col justify-between selection:bg-yellow selection:text-ink">
      <SiteHeader activePage="home" />

      {/* Hero Dashboard — matches the uploaded home design */}
      <section id="top" className="hero-section flex-1 flex flex-col justify-center">
        <div className="hero-inner">
          <div className="hero-stage">
            <div className="hero-copy">
              <div className="eyebrow">
                <Sparkles size={14} className="text-yellow" /> YOUR NEXT FAVORITE IS IN HERE
              </div>
              <h1 className="hero-title">
                Dive In to
                <br />
                Inspiring
                <br />
                <span>Stories &</span>
                <br />
                Chapters.
              </h1>
              <p>Every plot twist, late-night chapter, and someday read—right where you need it.</p>
              <div className="hero-action-row">
                <Button onClick={() => setModalOpen(true)} className="hero-primary-action">
                  Add a book <BookHeart size={16} />
                </Button>
                <Link to="/shelf" className="hero-browse-link">
                  BROWSE MY SHELF <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Current Read Neo-brutalist Yellow Card */}
            <article className="hero-card hcard-reading relative">
              <div className="hero-soundwave-sticker" aria-hidden="true">
                <span className="soundwave-bar" style={{ animationDelay: "0s" }} />
                <span className="soundwave-bar" style={{ animationDelay: "0.2s" }} />
                <span className="soundwave-bar" style={{ animationDelay: "0.4s" }} />
                <span className="soundwave-bar" style={{ animationDelay: "0.1s" }} />
                <span className="soundwave-bar" style={{ animationDelay: "0.3s" }} />
              </div>
              <div className="hcard-topline">
                <div className="hcard-label">
                  <BookOpen size={14} /> CURRENT READ
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="hcard-choose"
                  onClick={() => setHeroPickerMode("current")}
                >
                  CHOOSE BOOK
                </Button>
              </div>

              {currentBook ? (
                <div className="hcard-reading-body">
                  <div className="hero-feature-cover">
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
                      className={`hero-feature-placeholder${currentBook.cover && !currentBook.loading ? " hidden" : ""}`}
                    >
                      <BookPlaceholder title={currentBook.title} />
                    </div>
                  </div>
                  <div className="hcard-reading-info">
                    <span className="hero-feature-kicker">ON YOUR NIGHTSTAND</span>
                    <h3>{currentBook.title}</h3>
                    <p className="hcard-author">by {currentBook.author}</p>
                    {cleanDescription(currentBook.description) && (
                      <blockquote className="hcard-quote">
                        “
                        {cleanDescription(currentBook.description)
                          .replace(/<[^>]*>/g, " ")
                          .slice(0, 92)
                          .trim()}
                        …”
                      </blockquote>
                    )}
                    <div className="hcard-actions-row">
                      <Button
                        type="button"
                        className="hcard-complete-btn"
                        onClick={() => handleCompleteBook(currentBook.id)}
                        title="Mark this book as completed"
                      >
                        <Check size={13} /> Mark completed
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hcard-update-btn"
                        onClick={() => setEditingBook(currentBook)}
                      >
                        <BookOpen size={13} /> Details
                      </Button>
                      {currentBook.hasPdf && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="pdf-pill"
                          onClick={() => openPdf(currentBook.id)}
                          title="Open PDF"
                        >
                          <FileText size={13} /> Read PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hcard-reading-empty">
                  <BookOpen size={32} />
                  <p>What are you reading?</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="hero-empty-choose"
                    onClick={() => setHeroPickerMode("current")}
                  >
                    Choose your current read <ArrowRight size={15} />
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

          {/* Reading Statistics Magenta Band */}
          <div className="hero-stats-band" aria-label="Reading statistics">
            <div className="hero-stat">
              <span className="hero-stat-icon-badge" aria-hidden="true">
                <Library size={18} />
              </span>
              <div className="hero-stat-text">
                <strong>{books.length}</strong>
                <span>Books In Nook</span>
              </div>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon-badge" aria-hidden="true">
                <Check size={18} />
              </span>
              <div className="hero-stat-text">
                <strong>{completed}</strong>
                <span>Stories Finished</span>
              </div>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon-badge" aria-hidden="true">
                <Bookmark size={18} />
              </span>
              <div className="hero-stat-text">
                <strong>{tbr}</strong>
                <span>On Your TBR</span>
              </div>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon-badge" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <div className="hero-stat-text">
                <strong>{reading > 0 ? reading : currentBook ? 1 : 0}</strong>
                <span>Reading Now</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Up Next + Wishlist CTA */}
          <div className="hero-bottom-grid">
            <div className="hero-card hcard-queue">
              <div className="hcard-queue-header">
                <span className="hcard-queue-title">Up next</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="hcard-queue-viewall"
                  onClick={() => setHeroPickerMode("up-next")}
                >
                  CHOOSE BOOKS
                </Button>
              </div>
              {displayedUpNext.length > 0 ? (
                displayedUpNext.map((b, i) => {
                  const badgeClass =
                    i === 0
                      ? "hqueue-badge--yellow"
                      : i === 1
                        ? "hqueue-badge--mint"
                        : "hqueue-badge--coral";
                  return (
                    <div
                      key={b.id}
                      className="hcard-queue-item cursor-pointer"
                      onClick={() => setEditingBook(b)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className={`hqueue-badge ${badgeClass}`}>0{i + 1}</span>
                      <div className="hqueue-info">
                        <span className="hqueue-title">{b.title}</span>
                        {b.author && <span className="hqueue-author">{b.author}</span>}
                      </div>
                      <ChevronRight size={14} className="hqueue-arrow" />
                    </div>
                  );
                })
              ) : (
                <div className="hqueue-empty-state">
                  <p>
                    Your next chapter starts here. Choose up to three books for your reading queue.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              className="hero-card hcard-wishlist"
              onClick={() => setModalOpen(true)}
            >
              <span className="hcard-wishlist-icon-badge">
                <BookHeart size={22} />
              </span>
              <span className="hcard-wishlist-copy">
                <strong>Find your next favorite</strong>
                <small>Add a book to your nook</small>
              </span>
              <ArrowRight size={20} className="hcard-wishlist-arrow" />
            </Button>
          </div>
        </div>
      </section>

      {/* Bookish wisdom & cozy footer */}
      <section id="quote" className="quote-section">
        <span className="giant-quote">"</span>
        <div>
          <p>A room without books is like a body without a soul.</p>
          <span>— Marcus Tullius Cicero</span>
        </div>
        <svg viewBox="0 0 170 170" aria-hidden="true">
          <circle className="fill-yellow stroke-ink" cx="85" cy="86" r="59" strokeWidth="3" />
          <path className="fill-coral stroke-ink" strokeWidth="3" d="M47 115V53h61v62l-30-17Z" />
          <path
            className="stroke-ink"
            strokeWidth="4"
            strokeLinecap="round"
            d="M129 28l9-13m10 32 15-4m-31 7 9 9"
          />
        </svg>
      </section>

      <footer>
        <Link to="/" className="logo-mark">
          <span className="logo-icon-box">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </span>
          The Book Nook.
        </Link>
        <p>Made for slow mornings, late nights, and very full shelves.</p>
        <Link to="/shelf" className="font-bold underline hover:text-coral transition-colors">
          Go to my shelf →
        </Link>
      </footer>
    </main>
  );
}
