import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowRight,
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
    <main className="min-h-screen bg-background text-ink flex flex-col justify-between selection:bg-yellow selection:text-ink">
      <SiteHeader activePage="shelf" />

      {/* Main Bookshelf Section */}
      <section id="shelves" className="shelf-section flex-1">
        <div className="section-heading">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-ink flex items-center gap-1 transition-colors"
              >
                ← Home
              </Link>
              <span className="text-xs text-muted-foreground/60">•</span>
              <span className="eyebrow plain">MY BOOKSHELF</span>
            </div>
            <h2>
              What's on the <em>shelf?</em>
            </h2>
          </div>
          <p>
            {visibleBooks.length} {visibleBooks.length === 1 ? "book" : "books"} in view
            {selectedGenre !== "All" && ` · ${selectedGenre}`}
          </p>
        </div>

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
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X />
                </Button>
              )}
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

        <div className="genre-filter-strip" role="group" aria-label="Filter by genre">
          <span className="genre-filter-label">
            <Sparkles className="w-3.5 h-3.5" /> Genre:
          </span>
          <div className="genre-pill-list">
            {availableGenres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={`genre-filter-pill ${selectedGenre === g ? "is-active" : ""}`}
              >
                {g === "All" ? "All Genres" : g}
              </button>
            ))}
          </div>
          {selectedGenre !== "All" && (
            <button
              type="button"
              className="genre-clear-btn"
              onClick={() => setSelectedGenre("All")}
            >
              Clear filter <X className="w-3.5 h-3.5 inline" />
            </button>
          )}
        </div>

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
                            : handleCompleteBook(book.id)
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
              <Button onClick={() => setSelectedGenre("All")} className="hero-button">
                Show All Genres
              </Button>
            ) : (
              <Button onClick={() => setModalOpen(true)} className="hero-button">
                + Add a Book
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Bookish wisdom */}
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

      {/* CTA Band */}
      <section className="cta-band">
        <div className="max-w-xl mx-auto text-center flex flex-col items-center">
          <span className="eyebrow plain">ONE MORE CHAPTER?</span>
          <h2>
            Add your next <em>great read.</em>
          </h2>
          <Button onClick={() => setModalOpen(true)} className="hero-button">
            Add a Book <BookHeart />
          </Button>
        </div>
      </section>

      <footer>
        <Link to="/" className="logo-mark">
          <span className="logo-icon-box">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </span>
          The Book Nook.
        </Link>
        <p>Made for slow mornings, late nights, and very full shelves.</p>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-coral transition-colors font-bold">
            ← Home
          </Link>
          <a href="#shelves" className="hover:text-coral transition-colors">
            Back to top ↑
          </a>
        </div>
      </footer>
    </main>
  );
}
