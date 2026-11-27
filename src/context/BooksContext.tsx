import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deletePdf,
  getPdf,
  loadBooksFromIndexedDb,
  saveBooksToIndexedDb,
  savePdf,
} from "@/lib/pdfStore";
import { migrateEverythingToSupabase } from "@/lib/migrateToSupabase";
import {
  deleteBookFromDb,
  deletePdfFromStorage,
  fetchBooksFromDb,
  fetchUserPrefs,
  getPdfUrlFromStorage,
  isSupabaseConfigured,
  saveBookToDb,
  saveUserPrefs,
  seedBooksInDb,
  supabase,
  uploadCoverToStorage,
  uploadPdfToStorage,
  type DbBookRow,
} from "@/lib/supabase";
import { isBookRating, type Book, type BookRating, type HeroPickerMode, type BookMeta } from "@/types/book";
import { cleanDescription } from "@/components/ReaderArt";

export const seedGenreMap: Record<string, string> = {
  "Atmosphere: A Love Story": "Romance",
  "Fake Skating": "Young Adult",
  "Heart the Lover": "Fiction",
  "In Your Dreams": "Romance",
  Intermezzo: "Literary Fiction",
  "Normal People": "Literary Fiction",
  "Queen of Shadows": "Sci-Fi & Fantasy",
  "Strangers: A Memoir of Marriage": "Memoir & Biography",
  "The Correspondent": "Historical Fiction",
  "The Mating Game": "Romance",
  "The Only One Left": "Mystery & Thriller",
  "Tomorrow, and Tomorrow, and Tomorrow": "Fiction",
  "Where the Crawdads Sing": "Mystery & Thriller",
  Yesteryear: "Sci-Fi & Fantasy",
  "Days at the Morisaki Bookshop": "Cozy Fiction",
  "Wish I Could Tell You": "Romance",
  "Fool Me Twice": "Romance",
  "The Match": "Romance",
  "400 Days": "Mystery & Thriller",
  "A Man Called Ove": "Fiction",
  "The Silent Patient": "Mystery & Thriller",
  "The Lion Women of Tehran": "Historical Fiction",
  "A Touch of Eternity": "Romance",
  "Animal Farm": "Classics",
  "On the Open Road": "Self-Help",
  "Days at the Torunka Café": "Cozy Fiction",
};

export const seedPairs = [
  ["Atmosphere: A Love Story", "Taylor Jenkins Reid"],
  ["Fake Skating", "Lynn Painter"],
  ["Heart the Lover", "Lily King"],
  ["In Your Dreams", "Sarah Adams"],
  ["Intermezzo", "Sally Rooney"],
  ["Normal People", "Sally Rooney"],
  ["Queen of Shadows", "Sarah J. Maas"],
  ["Strangers: A Memoir of Marriage", "Belle Burden"],
  ["The Correspondent", "Virginia Evans"],
  ["The Mating Game", "Lana Ferguson"],
  ["The Only One Left", "Riley Sager"],
  ["Tomorrow, and Tomorrow, and Tomorrow", "Gabrielle Zevin"],
  ["Where the Crawdads Sing", "Delia Owens"],
  ["Yesteryear", "RWW Greene"],
  ["Days at the Morisaki Bookshop", "Satoshi Yagisawa"],
  ["Wish I Could Tell You", "Durjoy Datta"],
  ["Fool Me Twice", "Nona Uppal"],
  ["The Match", "Sarah Adams"],
  ["400 Days", "Chetan Bhagat"],
  ["A Man Called Ove", "Fredrik Backman"],
  ["The Silent Patient", "Alex Michaelides"],
  ["The Lion Women of Tehran", "Marjan Kamali"],
  ["A Touch of Eternity", "Durjoy Datta"],
  ["Animal Farm", "George Orwell"],
  ["On the Open Road", "Stuti Changle"],
  ["Days at the Torunka Café", "Satoshi Yagisawa"],
] as const;

export const defaultDescription = "";

export const seededBooks: Book[] = seedPairs.map(([title, author], index) => ({
  id: `seed-${index + 1}`,
  title,
  author,
  cover: "",
  description: "",
  status: title === "The Lion Women of Tehran" ? "Reading" : "TBR",
  addedAt: Date.now() - index,
  loading: true,
  hasPdf: false,
  pdfFileName: null,
  pdfFileSize: null,
  genre: seedGenreMap[title] || "Fiction",
}));

export const BOOKS_KEY = "book-nook-books-v1";
export const META_KEY = "book-nook-meta-v1";
export const PDF_SIZE_WARN = 10 * 1024 * 1024; // 10 MB

export function rowToBook(row: DbBookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    cover: row.cover || "",
    description: cleanDescription(row.description),
    status: row.status,
    genre: row.genre || "Fiction",
    addedAt: Number(row.added_at),
    hasPdf: Boolean(row.has_pdf),
    pdfFileName: row.pdf_file_name,
    pdfFileSize: row.pdf_file_size,
    rating: row.rating ?? null,
  };
}

export function bookToRow(book: Book): DbBookRow {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover || "",
    description: book.description || "",
    status: book.status,
    genre: book.genre || "Fiction",
    added_at: book.addedAt,
    has_pdf: Boolean(book.hasPdf),
    pdf_file_name: book.pdfFileName || null,
    pdf_file_size: book.pdfFileSize || null,
    pdf_storage_path: book.hasPdf ? `${book.id}.pdf` : null,
    rating: book.rating ?? null,
  };
}

export function mergeLocalBookRatings(remoteBooks: Book[], localBooks: Book[]): Book[] {
  const ratingsById = new Map<string, BookRating>();
  for (const book of localBooks) {
    if (isBookRating(book.rating)) ratingsById.set(book.id, book.rating);
  }
  return remoteBooks.map((book) => {
    const rating = ratingsById.get(book.id);
    return rating ? { ...book, rating } : book;
  });
}

export function safeSaveToLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      if (key === BOOKS_KEY) {
        const parsed = JSON.parse(value) as Book[];
        const lightweight = parsed.map((b) => ({
          ...b,
          cover: b.cover.startsWith("data:") ? "" : b.cover,
        }));
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      // Graceful fallback
    }
  }
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 480;
        const MAX_HEIGHT = 720;
        let { width, height } = img;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
          return;
        }
        resolve(typeof e.target?.result === "string" ? e.target.result : "");
      };
      img.onerror = () => resolve(typeof e.target?.result === "string" ? e.target.result : "");
      img.src = typeof e.target?.result === "string" ? e.target.result : "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function readCache(): Record<string, BookMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
  } catch {
    return {};
  }
}

let googleRateLimitedUntil = 0;

export async function fetchBookMeta(title: string, author: string): Promise<BookMeta> {
  const key = `${title}|${author}`.toLowerCase();
  const cache = readCache();
  if (cache[key]) return cache[key];

  let result: BookMeta = { cover: "", description: defaultDescription, genre: null };
  try {
    const isGoogleBlocked = Date.now() < googleRateLimitedUntil;
    if (!isGoogleBlocked) {
      const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
      const google = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`,
      );
      if (google.status === 429) {
        googleRateLimitedUntil = Date.now() + 60_000;
      } else if (google.ok) {
        const data = await google.json();
        const info = data.items?.[0]?.volumeInfo;
        const thumb = info?.imageLinks?.thumbnail as string | undefined;
        const category = info?.categories?.[0];
        let genreCandidate: string | undefined;
        if (category) {
          const parts = category.split("/").map((s: string) => s.trim());
          genreCandidate = parts[parts.length - 1] || parts[0];
        }
        result = {
          cover: thumb ? thumb.replace("http://", "https://").replace("zoom=1", "zoom=2") : "",
          description: info?.description || defaultDescription,
          genre: genreCandidate || null,
        };
      }
    }

    if (!result.cover) {
      const openLibrary = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`,
      );
      if (openLibrary.ok) {
        const data = await openLibrary.json();
        const doc = data.docs?.[0];
        if (doc?.cover_i) result.cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
  } catch {
    // illustrated fallback remains available
  }

  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...cache, [key]: result }));
  } catch {
    // quota ignore
  }
  return result;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface BooksContextValue {
  books: Book[];
  hydrated: boolean;
  currentReadId: string | null;
  upNextIds: string[];
  migrating: boolean;
  migrationStatus: string | null;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  pendingCompletionBook: Book | null;
  cancelBookCompletion: () => void;
  confirmBookCompletion: (rating: number) => void;
  editingBook: Book | null;
  setEditingBook: (book: Book | null) => void;
  bookToDelete: Book | null;
  setBookToDelete: (book: Book | null) => void;
  heroPickerMode: HeroPickerMode;
  setHeroPickerMode: (mode: HeroPickerMode) => void;
  celebrating: string | null;
  completed: number;
  reading: number;
  tbr: number;
  rhythm: number;
  currentBook: Book | null;
  upNextBooks: Book[];
  displayedUpNext: Book[];
  availableGenres: string[];
  handleMigrate: () => Promise<void>;
  addBook: (book: Book, pdfFile?: File | null) => Promise<void>;
  saveBook: (updated: Book, pdfFile?: File | null, pdfRemoved?: boolean) => Promise<void>;
  openPdf: (bookId: string) => Promise<void>;
  handleCompleteBook: (id: string, rating?: number | null) => void;
  handleRequestComplete: (id: string) => void;
  pendingRatingBookId: string | null;
  setPendingRatingBookId: (id: string | null) => void;
  toggleStatus: (id: string) => void;
  toggleUpNext: (bookId: string) => void;
  chooseCurrentRead: (book: Book) => void;
  handleRequestDelete: (book: Book) => void;
  confirmDeleteBook: () => void;
}

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>(seededBooks);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [pendingCompletionBookId, setPendingCompletionBookId] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [pendingRatingBookId, setPendingRatingBookId] = useState<string | null>(null);

  // Default to Lion Women of Tehran ("seed-22") and top 3 for Up Next if no storage
  const [currentReadId, setCurrentReadId] = useState<string | null>("seed-22");
  const [heroPickerMode, setHeroPickerMode] = useState<HeroPickerMode>(null);
  const [upNextIds, setUpNextIds] = useState<string[]>(["seed-15", "seed-2", "seed-3"]);

  const prefsLoadedRef = useRef(false);
  const isRemotePrefsUpdateRef = useRef(false);

  useEffect(() => {
    if (!prefsLoadedRef.current) return;
    if (isRemotePrefsUpdateRef.current) {
      isRemotePrefsUpdateRef.current = false;
      return;
    }

    localStorage.setItem("book-nook-up-next-v1", JSON.stringify(upNextIds));
    if (currentReadId !== null) {
      localStorage.setItem("book-nook-current-read-v1", currentReadId);
    } else {
      localStorage.removeItem("book-nook-current-read-v1");
    }

    if (isSupabaseConfigured) {
      void saveUserPrefs({ current_read_id: currentReadId, up_next_ids: upNextIds });
    }
  }, [upNextIds, currentReadId]);

  useEffect(() => {
    if (!hydrated) return;
    const completedIds = new Set(books.filter((b) => b.status === "Completed").map((b) => b.id));
    const hasCompletedInUpNext = upNextIds.some((id) => completedIds.has(id));
    if (hasCompletedInUpNext) {
      setUpNextIds((prev) => prev.filter((id) => !completedIds.has(id)));
    }
  }, [books, hydrated, upNextIds]);

  const handleMigrate = async () => {
    if (migrating || !isSupabaseConfigured) return;
    setMigrating(true);
    toast.info("Syncing local library to Supabase...", {
      description: "Uploading covers, PDFs, and book records to cloud storage.",
    });

    try {
      const result = await migrateEverythingToSupabase((p) => {
        if (p.phase === "covers") setMigrationStatus(`Covers ${p.current}/${p.total}`);
        else if (p.phase === "pdfs") setMigrationStatus(`PDFs ${p.current}/${p.total}`);
        else if (p.phase === "rows") setMigrationStatus(`Saving ${p.current}/${p.total}`);
        else if (p.phase === "done") setMigrationStatus(null);
      });

      const freshRows = await fetchBooksFromDb();
      if (freshRows && freshRows.length > 0) {
        const cloudBooks = mergeLocalBookRatings(freshRows.map(rowToBook), books);
        setBooks(cloudBooks);
        safeSaveToLocalStorage(BOOKS_KEY, JSON.stringify(cloudBooks));
        void saveBooksToIndexedDb(cloudBooks);
      }

      toast.success("Cloud sync complete!", {
        description: `Synced ${result.rowsUpserted} books, ${result.coversUploaded} covers, and ${result.pdfsUploaded} PDFs.`,
      });
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setMigrating(false);
      setMigrationStatus(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function initBooks() {
      try {
        const savedRead = localStorage.getItem("book-nook-current-read-v1");
        if (savedRead !== null) {
          setCurrentReadId(savedRead);
        } else {
          setCurrentReadId("seed-22");
        }
        const savedUpNext = JSON.parse(
          localStorage.getItem("book-nook-up-next-v1") ?? "null",
        ) as unknown;
        if (Array.isArray(savedUpNext) && savedUpNext.length > 0) {
          setUpNextIds(savedUpNext.filter((id): id is string => typeof id === "string"));
        } else {
          setUpNextIds(["seed-15", "seed-2", "seed-3"]);
        }
      } catch {
        setCurrentReadId("seed-22");
        setUpNextIds(["seed-15", "seed-2", "seed-3"]);
      }

      let localBooks: Book[] = seededBooks;
      try {
        const saved = localStorage.getItem(BOOKS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Book[];
          localBooks = parsed.map((book) => ({
            ...book,
            description: cleanDescription(book.description),
            genre: book.genre || seedGenreMap[book.title] || "Fiction",
          }));
        }
      } catch {
        localBooks = seededBooks;
      }

      try {
        const idbBooks = await loadBooksFromIndexedDb<Book>();
        if (idbBooks && idbBooks.length > 0) {
          if (idbBooks.length >= localBooks.length) {
            localBooks = idbBooks.map((b) => ({
              ...b,
              description: cleanDescription(b.description),
            }));
          }
        }
      } catch {
        // Fallback
      }

      setBooks(localBooks);
      setHydrated(true);

      if (isSupabaseConfigured) {
        try {
          const isOnlyDefaults =
            localBooks.length === seededBooks.length &&
            localBooks.every((b) => b.id.startsWith("seed-"));

          if (!isOnlyDefaults && localBooks.length > 0) {
            await seedBooksInDb(localBooks.map(bookToRow));
          }

          const [dbRows, dbPrefs] = await Promise.all([fetchBooksFromDb(), fetchUserPrefs()]);
          if (cancelled) return;

          if (dbRows && dbRows.length > 0) {
            const cloudBooks = mergeLocalBookRatings(dbRows.map(rowToBook), localBooks);
            setBooks(cloudBooks);
            safeSaveToLocalStorage(
              BOOKS_KEY,
              JSON.stringify(cloudBooks.map((b) => ({ ...b, loading: false }))),
            );
            void saveBooksToIndexedDb(cloudBooks.map((b) => ({ ...b, loading: false })));
          } else {
            await seedBooksInDb(localBooks.map(bookToRow));
          }

          if (dbPrefs) {
            const allResolvedBooks =
              dbRows && dbRows.length > 0 ? dbRows.map(rowToBook) : localBooks;
            if (dbPrefs.current_read_id) {
              const currentReadBook = allResolvedBooks.find(
                (b) => b.id === dbPrefs.current_read_id,
              );
              if (currentReadBook && currentReadBook.status !== "Completed") {
                setCurrentReadId(dbPrefs.current_read_id);
                localStorage.setItem("book-nook-current-read-v1", dbPrefs.current_read_id);
              } else {
                const firstValid = (dbPrefs.up_next_ids ?? [])
                  .map((id) => allResolvedBooks.find((b) => b.id === id))
                  .find((b) => b && b.status !== "Completed");
                const nextId = firstValid
                  ? firstValid.id
                  : (allResolvedBooks.find((b) => b.status === "Reading")?.id ?? null);
                setCurrentReadId(nextId);
                if (nextId) localStorage.setItem("book-nook-current-read-v1", nextId);
                else localStorage.removeItem("book-nook-current-read-v1");
              }
            }
            if (dbPrefs.up_next_ids && dbPrefs.up_next_ids.length > 0) {
              const cleanUpNext = dbPrefs.up_next_ids
                .filter((id) => {
                  const b = allResolvedBooks.find((bk) => bk.id === id);
                  return b && b.status !== "Completed";
                })
                .slice(0, 3);
              setUpNextIds(cleanUpNext);
              localStorage.setItem("book-nook-up-next-v1", JSON.stringify(cleanUpNext));
            }
          }
        } catch (err) {
          console.error("Supabase sync error:", err);
        } finally {
          prefsLoadedRef.current = true;
        }
      } else {
        prefsLoadedRef.current = true;
      }
    }

    void initBooks();

    if (typeof window !== "undefined") {
      (window as unknown as { migrateToSupabase: () => void }).migrateToSupabase = () =>
        void handleMigrate();
      const alreadyMigrated = localStorage.getItem("book-nook-migrated-to-supabase-v1") === "true";
      if (isSupabaseConfigured && !alreadyMigrated) {
        void handleMigrate();
      }
    }

    let booksChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    let prefsChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (isSupabaseConfigured && supabase) {
      booksChannel = supabase
        .channel("books-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "books" }, (payload) => {
          if (payload.eventType === "INSERT") {
            const newBook = rowToBook(payload.new as DbBookRow);
            setBooks((current) => {
              if (current.some((b) => b.id === newBook.id)) return current;
              return [newBook, ...current];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedBook = rowToBook(payload.new as DbBookRow);
            setBooks((current) =>
              current.map((b) => {
                if (b.id !== updatedBook.id) return b;
                return {
                  ...b,
                  ...updatedBook,
                  cover: updatedBook.cover || b.cover,
                  description:
                    updatedBook.description && updatedBook.description !== defaultDescription
                      ? updatedBook.description
                      : b.description || updatedBook.description,
                };
              }),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setBooks((current) => current.filter((b) => b.id !== deletedId));
            }
          }
        })
        .subscribe();

      prefsChannel = supabase
        .channel("user-prefs-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_prefs", filter: "id=eq.default" },
          (payload) => {
            if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
              const row = payload.new as {
                current_read_id?: string | null;
                up_next_ids?: string[];
              };
              isRemotePrefsUpdateRef.current = true;
              if (row.current_read_id !== undefined) {
                setCurrentReadId(row.current_read_id ?? null);
                if (row.current_read_id) {
                  localStorage.setItem("book-nook-current-read-v1", row.current_read_id);
                } else {
                  localStorage.removeItem("book-nook-current-read-v1");
                }
              }
              if (Array.isArray(row.up_next_ids)) {
                const capped = row.up_next_ids.slice(0, 3);
                setUpNextIds(capped);
                localStorage.setItem("book-nook-up-next-v1", JSON.stringify(capped));
              }
            }
          },
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (supabase) {
        if (booksChannel) void supabase.removeChannel(booksChannel);
        if (prefsChannel) void supabase.removeChannel(prefsChannel);
      }
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      safeSaveToLocalStorage(
        BOOKS_KEY,
        JSON.stringify(books.map((book) => ({ ...book, loading: false }))),
      );
      void saveBooksToIndexedDb(books.map((book) => ({ ...book, loading: false })));
    }
  }, [books, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const pending = books
      .filter((book) => !book.cover && book.description === defaultDescription)
      .slice(0, 26);
    if (!pending.length) return;
    let cancelled = false;
    const enrich = async () => {
      for (let i = 0; i < pending.length; i += 3) {
        const batch = pending.slice(i, i + 3);
        const results = await Promise.all(
          batch.map((book) => fetchBookMeta(book.title, book.author)),
        );
        if (cancelled) return;
        setBooks((current) =>
          current.map((book) => {
            const index = batch.findIndex((item) => item.id === book.id);
            if (index >= 0) {
              const meta = results[index];
              if (!meta) return book;
              const appliedCover = book.cover ? book.cover : meta.cover || "";
              const appliedDescription =
                book.description && book.description !== defaultDescription
                  ? book.description
                  : meta.description || defaultDescription;
              const appliedGenre =
                book.genre && book.genre !== "Fiction"
                  ? book.genre
                  : meta.genre || book.genre || "Fiction";
              const updated: Book = {
                ...book,
                cover: appliedCover,
                description: appliedDescription,
                genre: appliedGenre,
                loading: false,
              };
              if (
                (!book.cover && updated.cover) ||
                (book.description === defaultDescription &&
                  updated.description !== defaultDescription)
              ) {
                if (isSupabaseConfigured) void saveBookToDb(bookToRow(updated));
              }
              return updated;
            }
            return book;
          }),
        );
        await new Promise((r) => setTimeout(r, 600));
      }
    };
    void enrich();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const completed = books.filter((b) => b.status === "Completed").length;
  const reading = books.filter((b) => b.status === "Reading").length;
  const tbr = books.filter((b) => b.status === "TBR").length;
  const rhythm = books.length ? Math.round((completed / books.length) * 100) : 0;
  const pendingCompletionBook =
    books.find((book) => book.id === pendingCompletionBookId) ?? null;

  const currentBook = useMemo(() => {
    if (currentReadId) {
      const found = books.find((b) => b.id === currentReadId);
      if (found && found.status !== "Completed") return found;
    }
    const readingBook = books.find((b) => b.status === "Reading");
    if (readingBook) return readingBook;
    // Default fallback to "seed-22" if available
    const lionBook = books.find((b) => b.title === "The Lion Women of Tehran");
    if (lionBook && lionBook.status !== "Completed") return lionBook;
    return books[0] || null;
  }, [books, currentReadId]);

  const upNextBooks = useMemo(
    () =>
      upNextIds
        .map((id) => books.find((b) => b.id === id))
        .filter((b): b is Book => !!b && b.status !== "Completed"),
    [books, upNextIds],
  );

  const displayedUpNext = useMemo(() => {
    const pinned = upNextIds
      .map((id) => books.find((b) => b.id === id))
      .filter((b): b is Book => !!b && b.status !== "Completed");
    if (pinned.length >= 3) return pinned.slice(0, 3);
    const pinnedIds = new Set(pinned.map((b) => b.id));
    const currentId = currentBook?.id;
    const fallbacks = books.filter(
      (b) => b.id !== currentId && b.status !== "Completed" && !pinnedIds.has(b.id),
    );
    return [...pinned, ...fallbacks].slice(0, 3);
  }, [books, upNextIds, currentBook]);

  const MAX_UP_NEXT = 3;

  const toggleUpNext = (bookId: string) => {
    const target = books.find((b) => b.id === bookId);
    if (!target) return;

    if (target.status === "Completed") {
      toast.error("Already completed!", {
        description: `"${target.title}" is finished and cannot be added to Up Next.`,
      });
      return;
    }

    setUpNextIds((prev) => {
      if (prev.includes(bookId)) {
        toast("Removed from Up Next", { description: target.title });
        return prev.filter((id) => id !== bookId);
      }
      const validPrev = prev.filter((id) => {
        const b = books.find((bk) => bk.id === id);
        return b && b.status !== "Completed";
      });
      if (validPrev.length >= MAX_UP_NEXT) {
        toast.error(`Up Next is full (max ${MAX_UP_NEXT})`, {
          description: "Remove a book from Up Next first.",
        });
        return prev;
      }
      toast("Added to Up Next 📖", { description: target.title });
      return [...validPrev, bookId];
    });
  };

  const chooseCurrentRead = (book: Book) => {
    setCurrentReadId(book.id);
    setUpNextIds((prev) => prev.filter((id) => id !== book.id));
    setBooks((current) =>
      current.map((item) => (item.id === book.id ? { ...item, status: "Reading" } : item)),
    );
    if (isSupabaseConfigured) void saveBookToDb(bookToRow({ ...book, status: "Reading" }));
    setHeroPickerMode(null);
    toast.success("Current read updated", { description: book.title });
  };

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    return ["All", ...Array.from(set).sort()];
  }, [books]);

  const handleRequestComplete = (id: string) => {
    setPendingRatingBookId(id);
  };

  const handleCompleteBook = (id: string, rating?: number | null) => {
    const target = books.find((book) => book.id === id);
    if (!target || target.status === "Completed") return;
    setPendingCompletionBookId(id);
  };

  const cancelBookCompletion = () => setPendingCompletionBookId(null);

  const confirmBookCompletion = (rating: number) => {
    if (!isBookRating(rating)) return;
    const target = books.find((book) => book.id === pendingCompletionBookId);
    if (!target || target.status === "Completed") {
      setPendingCompletionBookId(null);
      return;
    }

    const id = target.id;
    const isCurrent = id === currentReadId || id === currentBook?.id;

    let candidateNext = upNextIds
      .map((pid) => books.find((b) => b.id === pid))
      .find((b): b is Book => !!b && b.id !== id && b.status !== "Completed");

    if (!candidateNext && isCurrent) {
      candidateNext = displayedUpNext.find((b) => b.id !== id && b.status !== "Completed");
    }

    if (!candidateNext && isCurrent) {
      candidateNext = books.find((b) => b.id !== id && b.status === "TBR");
    }

<<<<<<< HEAD
    const updatedTarget: Book = { ...target, status: "Completed", rating: rating ?? null };
=======
    const updatedTarget: Book = { ...target, status: "Completed", rating };
>>>>>>> 986d9ff14ff59465de17e00ec4ff638f0c55480f

    setBooks((current) =>
      current.map((b) => {
        if (b.id === id) return updatedTarget;
        if (isCurrent && candidateNext && b.id === candidateNext.id) {
          return { ...b, status: "Reading" };
        }
        return b;
      }),
    );

    if (isSupabaseConfigured) {
      void saveBookToDb(bookToRow(updatedTarget));
      if (isCurrent && candidateNext) {
        void saveBookToDb(bookToRow({ ...candidateNext, status: "Reading" }));
      }
    }

    if (isCurrent) {
      const nextReadId = candidateNext ? candidateNext.id : null;
      const newUpNextIds = upNextIds.filter(
        (pid) => pid !== id && (!candidateNext || pid !== candidateNext.id),
      );
      setCurrentReadId(nextReadId);
      setUpNextIds(newUpNextIds);
    } else {
      setUpNextIds((prev) => prev.filter((pid) => pid !== id));
    }

<<<<<<< HEAD
    setPendingRatingBookId(null);
=======
    setPendingCompletionBookId(null);
>>>>>>> 986d9ff14ff59465de17e00ec4ff638f0c55480f
    setCelebrating(id);
    window.setTimeout(() => setCelebrating(null), 900);
    toast.success("Another story finished! 🎉", {
      description:
        isCurrent && candidateNext
          ? `"${target.title}" completed. Now reading "${candidateNext.title}"!`
          : `"${target.title}" moved to Completed.`,
    });
  };

  const toggleStatus = (id: string) => {
    const target = books.find((book) => book.id === id);
    if (!target) return;

    if (target.status === "Reading") {
      handleCompleteBook(id);
      return;
    }

    if (target.status === "TBR") {
      const updated = { ...target, status: "Reading" as const };
      setBooks((current) => current.map((book) => (book.id === id ? updated : book)));
      if (isSupabaseConfigured) void saveBookToDb(bookToRow(updated));
      setCurrentReadId(id);
      setUpNextIds((prev) => prev.filter((pid) => pid !== id));
      toast("Now reading! 📚", { description: target.title });
      return;
    }

    const updated = { ...target, status: "TBR" as const };
    setBooks((current) => current.map((book) => (book.id === id ? updated : book)));
    if (isSupabaseConfigured) void saveBookToDb(bookToRow(updated));
    if (currentReadId === id) {
      setCurrentReadId(null);
    }
    toast("Moved back to TBR", { description: target.title });
  };

  const handleRequestDelete = (book: Book) => {
    setBookToDelete(book);
  };

  const confirmDeleteBook = () => {
    if (!bookToDelete) return;
    const book = bookToDelete;
    setBooks((current) => current.filter((item) => item.id !== book.id));
    if (book.hasPdf) {
      void deletePdf(book.id);
      if (isSupabaseConfigured) void deletePdfFromStorage(book.id);
    }
    if (isSupabaseConfigured) {
      void deleteBookFromDb(book.id);
    }
    if (currentReadId === book.id) {
      setCurrentReadId(null);
    }
    setUpNextIds((prev) => prev.filter((id) => id !== book.id));
    toast.success("Book removed", { description: `"${book.title}" was removed from your nook.` });
    setBookToDelete(null);
  };

  const addBook = async (book: Book, pdfFile?: File | null) => {
    setBooks((current) => [book, ...current]);
    toast.success("Book tucked onto your shelf!", { description: book.title });

    if (pdfFile && isSupabaseConfigured) {
      void uploadPdfToStorage(book.id, pdfFile);
    }
    if (isSupabaseConfigured) {
      void saveBookToDb(bookToRow(book));
    }

    if (!book.cover) {
      void fetchBookMeta(book.title, book.author).then((meta) => {
        setBooks((current) =>
          current.map((item) => {
            if (item.id === book.id) {
              const appliedCover = item.cover ? item.cover : meta.cover || "";
              const appliedDescription =
                item.description && item.description !== defaultDescription
                  ? item.description
                  : meta.description || defaultDescription;
              const updated: Book = {
                ...item,
                cover: appliedCover,
                description: appliedDescription,
                genre: meta.genre || item.genre || "Fiction",
                loading: false,
              };
              if (isSupabaseConfigured) void saveBookToDb(bookToRow(updated));
              return updated;
            }
            return item;
          }),
        );
      });
    }
  };

  const saveBook = async (updated: Book, pdfFile?: File | null, pdfRemoved?: boolean) => {
    let bookToSave = updated;
    if (updated.cover?.startsWith("data:") && isSupabaseConfigured) {
      try {
        const res = await fetch(updated.cover);
        const blob = await res.blob();
        const storageUrl = await uploadCoverToStorage(updated.id, blob);
        if (storageUrl) {
          bookToSave = { ...updated, cover: storageUrl };
          setBooks((current) =>
            current.map((book) => (book.id === updated.id ? { ...book, cover: storageUrl } : book)),
          );
        }
      } catch {
        // Fallback
      }
    }

    const isCurrent = bookToSave.id === currentReadId || bookToSave.id === currentBook?.id;
    if (isCurrent && bookToSave.status === "Completed") {
      handleCompleteBook(bookToSave.id);
      return;
    }

    setBooks((current) =>
      current.map((book) => (book.id === bookToSave.id ? { ...book, ...bookToSave } : book)),
    );
    toast.success("Updated!", { description: `${bookToSave.title} has been saved.` });

    if (pdfFile && isSupabaseConfigured) {
      void uploadPdfToStorage(bookToSave.id, pdfFile);
    } else if (pdfRemoved && isSupabaseConfigured) {
      void deletePdfFromStorage(bookToSave.id);
    }

    if (isSupabaseConfigured) {
      void saveBookToDb(bookToRow(bookToSave));
    }

    if (!updated.cover) {
      void fetchBookMeta(updated.title, updated.author).then((meta) => {
        setBooks((current) =>
          current.map((item) => {
            if (item.id === updated.id) {
              const appliedCover = item.cover ? item.cover : meta.cover || "";
              const appliedDescription =
                item.description && item.description !== defaultDescription
                  ? item.description
                  : meta.description || defaultDescription;
              const withMeta: Book = {
                ...item,
                cover: appliedCover,
                description: appliedDescription,
                genre: meta.genre || item.genre || "Fiction",
                loading: false,
              };
              if (isSupabaseConfigured) void saveBookToDb(bookToRow(withMeta));
              return withMeta;
            }
            return item;
          }),
        );
      });
    }
  };

  const openPdf = async (bookId: string) => {
    try {
      const blob = await getPdf(bookId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        return;
      }

      if (isSupabaseConfigured) {
        const publicUrl = await getPdfUrlFromStorage(bookId);
        if (publicUrl) {
          window.open(publicUrl, "_blank");
          return;
        }
      }

      toast.error("PDF not found", {
        description: "The file may have been cleared or not uploaded.",
      });
    } catch {
      toast.error("Couldn't open PDF", {
        description: "Something went wrong reading from storage.",
      });
    }
  };

  const value: BooksContextValue = {
    books,
    hydrated,
    currentReadId,
    upNextIds,
    migrating,
    migrationStatus,
    modalOpen,
    setModalOpen,
    pendingCompletionBook,
    cancelBookCompletion,
    confirmBookCompletion,
    editingBook,
    setEditingBook,
    bookToDelete,
    setBookToDelete,
    heroPickerMode,
    setHeroPickerMode,
    celebrating,
    completed,
    reading,
    tbr,
    rhythm,
    currentBook,
    upNextBooks,
    displayedUpNext,
    availableGenres,
    handleMigrate,
    addBook,
    saveBook,
    openPdf,
    handleCompleteBook,
    handleRequestComplete,
    pendingRatingBookId,
    setPendingRatingBookId,
    toggleStatus,
    toggleUpNext,
    chooseCurrentRead,
    handleRequestDelete,
    confirmDeleteBook,
  };

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks(): BooksContextValue {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error("useBooks must be used within a BooksProvider");
  }
  return context;
}
