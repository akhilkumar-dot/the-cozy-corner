import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowLeft,
  Bookmark,
  BookHeart,
  BookOpen,
  Check,
  FileText,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { BookPlaceholder, cleanDescription } from "@/components/ReaderArt";
import { DripWave, SiteFooter, SunnyStickerBadge } from "@/components/NookDesign";
import { StarRating } from "@/components/BookModals";
import { useBooks } from "@/context/BooksContext";
import type { Shelf, SortMode } from "@/types/book";

export const Route = createFileRoute("/shelf")({
  head: () => ({
    meta: [
      { title: "My Shelf — The Book Nook" },
      {
        name: "description",
        content: "Explore and manage your entire reading shelf, search, and filter by genre.",
      },
      { property: "og:title", content: "My Shelf — The Book Nook" },
      {
        property: "og:description",
        content: "Your entire collection of books to read and stories completed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShelfPage,
});

function ShelfPage() {
  const {
    books,
    upNextIds,
    toggleUpNext,
    toggleStatus,
    handleCompleteBook,
    handleRequestComplete,
    handleRequestDelete,
    openPdf,
    setModalOpen,
    setEditingBook,
    celebrating,
    availableGenres,
  } = useBooks();

  const [shelf, setShelf] = useState<Shelf>("All");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const visibleBooks = useMemo(() => {
    const normalized = query.toLowerCase();
    return books
      .filter((book) => shelf === "All" || book.status === shelf)
      .filter((book) => selectedGenre === "All" || (book.genre ?? "Fiction") === selectedGenre)
      .filter((book) =>
        `${book.title} ${book.author} ${book.genre ?? ""}`.toLowerCase().includes(normalized),
      )
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "author"
            ? a.author.localeCompare(b.author)
            : b.addedAt - a.addedAt,
      );
  }, [books, shelf, selectedGenre, query, sort]);

  return (
    <main className="min-h-screen bg-[#FCFBF7] text-[#103A4E] flex flex-col justify-between selection:bg-[#FCE172] selection:text-[#103A4E] overflow-x-clip">
      <SiteHeader activePage="shelf" />

      {/* Orange Shelf Banner matching Hero aesthetic */}
      <section id="top" className="dds-hero-orange">
        <div className="dds-container relative z-10 pt-8 pb-6 md:pt-11 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full border border-white/35 transition-colors mb-3"
              >
                <ArrowLeft size={13} /> Home
              </Link>
              <h1 className="dds-hero-heading !text-4xl sm:!text-5xl md:!text-[3.4rem]">
                What's on the Shelf?
              </h1>
              <p className="dds-hero-subcopy mt-2">
                <strong>{visibleBooks.length}</strong>{" "}
                {visibleBooks.length === 1 ? "book" : "books"} in view
                {selectedGenre !== "All" && ` · ${selectedGenre}`}
              </p>
            </div>

            <div className="flex items-center gap-5 self-start md:self-center">
              <div className="relative hidden sm:block w-24 h-24 shrink-0">
                <SunnyStickerBadge
                  topText={`${books.length}`}
                  bottomText="Stories"
                  className="!top-0 !right-0"
                />
              </div>

              <Button
                type="button"
                onClick={() => setModalOpen(true)}
                className="dds-pill-btn dds-pill-navy dds-pill-lg"
              >
                <span className="dds-pill-icon dds-pill-icon-orange">
                  <BookHeart size={15} />
                </span>
                <span className="dds-pill-copy">
                  <small>Expand Collection</small>
                  <strong>+ ADD A BOOK</strong>
                </span>
              </Button>
            </div>
          </div>
        </div>

        <DripWave fillColor="#F47A3C" bottomBgColor="#FCFBF7" variant="orange-to-cyan" />
      </section>

      {/* Main Bookshelf Section */}
      <section id="shelves" className="shelf-section flex-1">
        <div className="dds-container">
          <div className="shelf-tools">
            <div className="shelf-tabs" role="tablist" aria-label="Book shelves">
              {(["All", "TBR", "Completed"] as Shelf[]).map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  role="tab"
                  aria-selected={shelf === item}
                  onClick={() => setShelf(item)}
                  className={shelf === item ? "active" : ""}
                >
                  {item === "TBR" ? "To Be Read" : item}
                </Button>
              ))}
            </div>
            <div className="search-sort-row">
              <label className="search-box">
                <Search />
                <span className="sr-only">Search books</span>
                <Input
                  aria-label="Search books"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, author, or genre…"
                  className="flex-1 h-full border-0 bg-transparent shadow-none rounded-none px-2.5 focus-visible:ring-0"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="h-7 w-7 rounded-full shrink-0 hover:bg-[#FAF5E8]"
                  >
                    <X />
                  </Button>
                )}
              </label>

              <div className="shelf-selects-pair">
                <label className="sort-box">
                  <Sparkles className="text-[#F47A3C]" />
                  <span className="sr-only">Filter by genre</span>
                  <select
                    aria-label="Filter by genre"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>
                        {g === "All" ? "All Genres" : g}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sort-box">
                  <ArrowDownAZ />
                  <span className="sr-only">Sort books</span>
                  <select
                    aria-label="Sort books"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                  >
                    <option value="recent">Recently added</option>
                    <option value="title">Title A–Z</option>
                    <option value="author">Author A–Z</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {(selectedGenre !== "All" || query) && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {selectedGenre !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedGenre("All")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F47A3C] text-white text-xs font-extrabold shadow-xs cursor-pointer hover:bg-[#e06526] transition-colors"
                >
                  <span>Genre: {selectedGenre}</span>
                  <X size={13} />
                </button>
              )}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4DC4D8]/25 text-[#103A4E] text-xs font-extrabold cursor-pointer hover:bg-[#4DC4D8]/40 transition-colors"
                >
                  <span>Search: “{query}”</span>
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {visibleBooks.length ? (
            <div className="book-grid">
              {visibleBooks.map((book, index) => (
                <article className="book-card" key={book.id}>
                  <div className="cover-wrap">
                    <span
                      className={`status-badge ${
                        book.status === "Completed"
                          ? "is-complete"
                          : book.status === "Reading"
                            ? "is-reading"
                            : ""
                      }`}
                    >
                      {book.status === "Reading" ? "Reading" : book.status}
                    </span>
                    {book.loading ? (
                      <div className="cover-skeleton" />
                    ) : book.cover ? (
                      <>
                        <img
                          src={book.cover}
                          alt={`Cover of ${book.title}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden h-full w-full">
                          <BookPlaceholder title={book.title} tone={index} />
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full">
                        <BookPlaceholder title={book.title} tone={index} />
                      </div>
                    )}
                  </div>
                  <div className="book-info">
                    <div className="book-meta-row">
                      <p className="author">by {book.author}</p>
                      {book.genre && <span className="genre-tag">{book.genre}</span>}
                    </div>
                    <h3>{book.title}</h3>
                    {book.status === "Completed" && book.rating != null && (
                      <StarRating rating={book.rating} />
                    )}
                    {cleanDescription(book.description) && (
                      <p className="description">
                        {cleanDescription(book.description).replace(/<[^>]*>/g, " ")}
                      </p>
                    )}
                  </div>
                  <div className="card-footer-actions">
                    <div className="card-actions-row">
                      <div className="card-primary-actions">
                        <button
                          type="button"
                          onClick={() =>
                            book.status === "Completed"
                              ? toggleStatus(book.id)
                              : handleRequestComplete(book.id)
                          }
                          className={`card-action-pill card-complete-btn ${
                            book.status === "Completed" ? "is-complete" : ""
                          }`}
                          title={
                            book.status === "Completed"
                              ? "Completed ✓ (click to revert)"
                              : "Mark as Completed"
                          }
                        >
                          <Check size={14} />
                          <span className="card-btn-text">
                            {book.status === "Completed" ? "Completed" : "Mark Completed"}
                          </span>
                        </button>
                        {book.hasPdf && (
                          <button
                            type="button"
                            className="card-action-pill card-pdf-btn is-pdf"
                            onClick={() => openPdf(book.id)}
                            title="Read PDF"
                          >
                            <FileText size={14} />
                            <span className="card-btn-text">Read PDF</span>
                          </button>
                        )}
                      </div>
                      <div className="card-icon-group">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleUpNext(book.id)}
                          disabled={book.status === "Completed"}
                          aria-label={
                            book.status === "Completed"
                              ? "Completed book cannot be added to Up Next"
                              : upNextIds.includes(book.id)
                                ? "Remove from Up Next"
                                : "Add to Up Next"
                          }
                          title={
                            book.status === "Completed"
                              ? "Completed book cannot be added to Up Next"
                              : upNextIds.includes(book.id)
                                ? "Remove from Up Next"
                                : "Add to Up Next"
                          }
                          className={`card-icon-btn card-bookmark-btn ${
                            upNextIds.includes(book.id) && book.status !== "Completed"
                              ? "is-pinned"
                              : ""
                          } ${book.status === "Completed" ? "opacity-25 cursor-not-allowed pointer-events-none" : ""}`}
                        >
                          <Bookmark size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBook(book)}
                          aria-label={`Edit ${book.title}`}
                          title="Edit book"
                          className="card-icon-btn"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRequestDelete(book)}
                          aria-label={`Remove ${book.title}`}
                          title="Remove book"
                          className="card-icon-btn card-icon-btn--danger"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {celebrating === book.id && (
                    <div className="confetti" aria-hidden="true">
                      ✦ <span>♥</span> ★ <b>✦</b> ●
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-shelf">
              <BookOpen />
              <h3>No stories here yet.</h3>
              <p>
                {selectedGenre !== "All"
                  ? `No books found under "${selectedGenre}". Try selecting All Genres or adjusting your search.`
                  : "Try another shelf or search, or add a new book."}
              </p>
              {selectedGenre !== "All" ? (
                <Button
                  onClick={() => setSelectedGenre("All")}
                  className="dds-mini-navy-btn px-5 h-10"
                >
                  Show All Genres
                </Button>
              ) : (
                <Button onClick={() => setModalOpen(true)} className="dds-mini-navy-btn px-5 h-10">
                  + Add a Book
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <DripWave fillColor="#FCFBF7" bottomBgColor="#4DC4D8" variant="cream-to-yellow" />

      {/* Bookish wisdom (Cyan wave section) */}
      <section id="quote" className="quote-section">
        <div className="dds-container quote-inner">
          <span className="giant-quote" aria-hidden="true">
            “
          </span>
          <div>
            <p>A room without books is like a body without a soul.</p>
            <span>— Marcus Tullius Cicero</span>
          </div>
          <svg viewBox="0 0 170 170" aria-hidden="true" className="quote-art">
            <circle cx="85" cy="86" r="59" fill="#FCE172" stroke="#103A4E" strokeWidth="3.5" />
            <path d="M55 118V54h60v64l-30-18Z" fill="#F47A3C" stroke="#103A4E" strokeWidth="3.5" />
            <path
              stroke="#103A4E"
              strokeWidth="4"
              strokeLinecap="round"
              d="M129 28l9-13m10 32 15-4m-31 7 9 9"
            />
          </svg>
        </div>
      </section>

      <DripWave fillColor="#4DC4D8" bottomBgColor="#FCE172" variant="cyan-to-cream" />

      {/* Sunny Yellow CTA Band */}
      <section className="cta-band">
        <div className="max-w-xl mx-auto text-center flex flex-col items-center">
          <span className="dds-kicker-chip mb-3">ONE MORE CHAPTER?</span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#103A4E] tracking-tight mb-5">
            Add your next <span className="text-[#F47A3C]">great read.</span>
          </h2>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="dds-pill-btn dds-pill-navy dds-pill-lg"
          >
            <span className="dds-pill-icon dds-pill-icon-orange">
              <BookHeart size={15} />
            </span>
            <span className="dds-pill-copy">
              <small>Build Your Collection</small>
              <strong>ADD A BOOK</strong>
            </span>
          </Button>
        </div>
      </section>

      <DripWave fillColor="#FCE172" bottomBgColor="#FAF5E8" variant="yellow-to-cyan" />

      <SiteFooter />
    </main>
  );
}
