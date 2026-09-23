import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownAZ,
  BookHeart,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  ImagePlus,
  Library,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deletePdf, getPdf, savePdf } from "@/lib/pdfStore";

type Status = "TBR" | "Completed";
type Shelf = "All" | Status;
type SortMode = "recent" | "title" | "author";

type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  status: Status;
  addedAt: number;
  loading?: boolean;
  hasPdf?: boolean;
  pdfFileName?: string | null;
  pdfFileSize?: number | null;
};

const seedPairs = [
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

const defaultDescription =
  "A story waiting for its turn on the shelf. Add your own notes after reading, or let the book details fill in automatically.";

const seededBooks: Book[] = seedPairs.map(([title, author], index) => ({
  id: `seed-${index + 1}`,
  title,
  author,
  cover: "",
  description: defaultDescription,
  status: "TBR",
  addedAt: Date.now() - index,
  loading: true,
  hasPdf: false,
  pdfFileName: null,
  pdfFileSize: null,
}));

const BOOKS_KEY = "book-nook-books-v1";
const META_KEY = "book-nook-meta-v1";
const PDF_SIZE_WARN = 10 * 1024 * 1024; // 10 MB

type BookMeta = { cover: string; description: string };

function readCache(): Record<string, BookMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
  } catch {
    return {};
  }
}

async function fetchBookMeta(title: string, author: string): Promise<BookMeta> {
  const key = `${title}|${author}`.toLowerCase();
  const cache = readCache();
  if (cache[key]) return cache[key];

  let result: BookMeta = { cover: "", description: defaultDescription };
  try {
    const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    const google = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    if (google.ok) {
      const data = await google.json();
      const info = data.items?.[0]?.volumeInfo;
      const thumb = info?.imageLinks?.thumbnail as string | undefined;
      result = {
        cover: thumb ? thumb.replace("http://", "https://").replace("zoom=1", "zoom=2") : "",
        description: info?.description || defaultDescription,
      };
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
    // The illustrated fallback remains available when a public catalog is offline.
  }

  localStorage.setItem(META_KEY, JSON.stringify({ ...cache, [key]: result }));
  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Book Nook — Personal Reading Tracker" },
      { name: "description", content: "A playful personal dashboard for tracking books to read and books completed." },
      { property: "og:title", content: "The Book Nook — Personal Reading Tracker" },
      { property: "og:description", content: "Keep your next great reads together in one bright, cozy corner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
}));

function ReaderIllustration({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 260 300" aria-hidden="true" className={`reader-art reader-art-${side}`}>
      <path className="fill-cloud" d="M20 262c-12-39 8-76 39-89 4-51 42-90 91-90 50 0 91 43 91 96 20 16 27 47 13 83H20Z" />
      <circle className="fill-skin" cx={side === "left" ? 126 : 134} cy="85" r="35" />
      <path className="fill-ink" d={side === "left" ? "M94 85c3-48 66-58 75-5-16-2-29-10-36-24-5 20-19 29-39 29Z" : "M99 86c0-52 68-58 75-4-17 1-33-9-39-25-5 19-17 28-36 29Z"} />
      <path className={side === "left" ? "fill-mint" : "fill-coral"} d="M65 260c3-77 22-127 65-127 48 0 70 47 72 127H65Z" />
      <path className="fill-skin" d={side === "left" ? "M92 151c17 15 28 32 34 52l-20 8c-12-19-24-35-36-44Z" : "M170 150c-18 14-30 33-36 54l21 8c11-20 23-36 36-45Z"} />
      <path className="fill-book" d={side === "left" ? "M112 172l69-13 10 70-70 12Z" : "M70 160l76 13-11 68-74-14Z"} />
      <path className="stroke-ink" d={side === "left" ? "M151 168l8 65" : "M108 168l-10 64"} fill="none" strokeWidth="3" />
      <circle className="fill-ink" cx={side === "left" ? 140 : 122} cy="87" r="3" />
      <path className="stroke-ink" d={side === "left" ? "M139 101q10 7 18-1" : "M103 101q10 7 18-1"} fill="none" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BookPlaceholder({ title, tone = 0 }: { title: string; tone?: number }) {
  const tones = ["bg-sky", "bg-yellow", "bg-mint", "bg-lavender", "bg-coral-soft"];
  return (
    <div className={`book-placeholder ${tones[tone % tones.length]}`}>
      <svg viewBox="0 0 140 110" aria-hidden="true" className="w-4/5 max-w-36">
        <path className="fill-cream stroke-ink" strokeWidth="3" d="M19 72l52 14 51-14v25L71 108 19 96Z" />
        <path className="fill-coral stroke-ink" strokeWidth="3" d="M24 48l47 13 43-15v27L71 87 24 74Z" />
        <path className="fill-yellow stroke-ink" strokeWidth="3" d="M32 25l41 13 35-13v23L72 61 32 49Z" />
        <path className="fill-ink" d="M65 12h15v28H65z" />
        <path className="fill-coral" d="M80 12l12 8-12 8Z" />
      </svg>
      <span>{title}</span>
    </div>
  );
}

// ─── PDF Uploader sub-component ────────────────────────────────────────────────
type PdfState = {
  file: File | null;       // newly selected file (pending save)
  /** existing PDF info pre-loaded from IndexedDB (edit mode) */
  existingName: string | null;
  existingSize: number | null;
  removed: boolean;        // user explicitly cleared an existing PDF
};

function PdfUploader({
  pdfState,
  onChange,
}: {
  pdfState: PdfState;
  onChange: (next: PdfState) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted. Please choose a .pdf file.");
      return;
    }
    onChange({ file, existingName: null, existingSize: null, removed: false });
  };

  // Current display info
  const displayName = pdfState.file?.name ?? (!pdfState.removed ? pdfState.existingName : null);
  const displaySize = pdfState.file?.size ?? (!pdfState.removed ? pdfState.existingSize : null);
  const hasFile = !!displayName;
  const isLarge = displaySize != null && displaySize > PDF_SIZE_WARN;

  const clear = () => {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange({ file: null, existingName: pdfState.existingName, existingSize: pdfState.existingSize, removed: true });
  };

  return (
    <div className="pdf-uploader-wrap">
      {!hasFile ? (
        <button
          type="button"
          className={`pdf-upload-zone${dragging ? " is-dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
          aria-label="Attach PDF"
        >
          <FileText aria-hidden="true" />
          <strong>Attach PDF (optional)</strong>
          <span>Drop a .pdf here or click to browse</span>
        </button>
      ) : (
        <div className="pdf-file-info">
          <FileText aria-hidden="true" />
          <span className="pdf-file-name">{displayName}</span>
          {displaySize != null && <span className="pdf-file-size">{formatBytes(displaySize)}</span>}
          <button type="button" className="pdf-clear-btn" onClick={clear} aria-label="Remove PDF attachment">
            <X />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error && <p className="pdf-error" role="alert">{error}</p>}
      {isLarge && !error && (
        <p className="pdf-warning">⚠ Large PDFs may slow things down — under 10 MB works best.</p>
      )}
    </div>
  );
}

// ─── Unified BookModal (add + edit) ───────────────────────────────────────────
type BookModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd?: (book: Book) => void;
  onSave?: (book: Book) => void;
  editBook?: Book | null;
};

function BookModal({ open, onOpenChange, onAdd, onSave, editBook }: BookModalProps) {
  const isEdit = !!editBook;

  const [cover, setCover] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdfState, setPdfState] = useState<PdfState>({
    file: null,
    existingName: null,
    existingSize: null,
    removed: false,
  });

  // Pre-fill when opening in edit mode
  useEffect(() => {
    if (!open) return;
    if (isEdit && editBook) {
      setCover(editBook.cover ?? "");
      // Load existing PDF info if any
      setPdfState({
        file: null,
        existingName: editBook.pdfFileName ?? null,
        existingSize: editBook.pdfFileSize ?? null,
        removed: false,
      });
    } else {
      setCover("");
      setPdfState({ file: null, existingName: null, existingSize: null, removed: false });
    }
  }, [open, isEdit, editBook]);

  const readImageFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCover(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const author = String(data.get("author") ?? "").trim();
    if (!title || !author) return;

    const id = isEdit && editBook ? editBook.id : crypto.randomUUID();

    // Handle PDF storage
    let hasPdf = false;
    let pdfFileName: string | null = null;
    let pdfFileSize: number | null = null;

    if (pdfState.file) {
      // New file selected — save to IndexedDB
      await savePdf(id, pdfState.file);
      hasPdf = true;
      pdfFileName = pdfState.file.name;
      pdfFileSize = pdfState.file.size;
    } else if (pdfState.removed) {
      // User explicitly removed existing PDF
      await deletePdf(id);
      hasPdf = false;
      pdfFileName = null;
      pdfFileSize = null;
    } else if (isEdit && editBook?.hasPdf && !pdfState.removed) {
      // Keep existing PDF untouched
      hasPdf = true;
      pdfFileName = editBook.pdfFileName ?? null;
      pdfFileSize = editBook.pdfFileSize ?? null;
    }

    const book: Book = {
      id,
      title,
      author,
      description: String(data.get("description") ?? "").trim() || defaultDescription,
      status: data.get("status") === "Completed" ? "Completed" : "TBR",
      cover,
      addedAt: isEdit && editBook ? editBook.addedAt : Date.now(),
      loading: !cover && !isEdit,
      hasPdf,
      pdfFileName,
      pdfFileSize,
    };

    if (isEdit) {
      onSave?.(book);
    } else {
      onAdd?.(book);
    }

    event.currentTarget.reset();
    setCover("");
    setPdfState({ file: null, existingName: null, existingSize: null, removed: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-2 border-ink bg-cream shadow-playful sm:max-w-xl sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            {isEdit ? "Edit this adventure" : "Add a new adventure"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details below. Your changes save in place."
              : "Pop in the details now. We'll look for a cover if you don't add one."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* Cover image uploader */}
          <button
            type="button"
            className={`upload-zone ${dragging ? "is-dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); readImageFile(event.dataTransfer.files[0]); }}
          >
            {cover ? <img src={cover} alt="Book cover preview" /> : <><ImagePlus /><strong>Drop a cover here</strong><span>or click to browse</span></>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => readImageFile(e.target.files?.[0])} />

          {/* PDF uploader */}
          <PdfUploader pdfState={pdfState} onChange={setPdfState} />

          <label className="field-label">Title
            <Input
              aria-label="Book title"
              name="title"
              required
              placeholder="The book title"
              defaultValue={isEdit ? editBook?.title : undefined}
              key={`title-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <label className="field-label">Author
            <Input
              aria-label="Book author"
              name="author"
              required
              placeholder="Who wrote it?"
              defaultValue={isEdit ? editBook?.author : undefined}
              key={`author-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <label className="field-label">A tiny note
            <Textarea
              name="description"
              rows={3}
              placeholder="What caught your eye?"
              defaultValue={isEdit && editBook?.description !== defaultDescription ? editBook?.description : undefined}
              key={`desc-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <label className="field-label">Shelf
            <select
              name="status"
              className="form-select"
              defaultValue={isEdit ? editBook?.status : "TBR"}
              key={`status-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            >
              <option value="TBR">To Be Read</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <Button
            type="submit"
            className="h-12 w-full rounded-full border-2 border-ink bg-coral font-display text-base text-ink shadow-button hover:bg-coral/90"
          >
            {isEdit ? <>Save Changes <Check /></> : <>Add to my nook <BookHeart /></>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Index() {
  const [books, setBooks] = useState<Book[]>(seededBooks);
  const [hydrated, setHydrated] = useState(false);
  const [shelf, setShelf] = useState<Shelf>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKS_KEY);
      setBooks(saved ? JSON.parse(saved) : seededBooks);
    } catch {
      setBooks(seededBooks);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BOOKS_KEY, JSON.stringify(books.map((book) => ({ ...book, loading: false }))));
  }, [books, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const pending = books.filter((book) => !book.cover && book.description === defaultDescription).slice(0, 26);
    if (!pending.length) return;
    let cancelled = false;
    const enrich = async () => {
      for (let i = 0; i < pending.length; i += 3) {
        const batch = pending.slice(i, i + 3);
        const results = await Promise.all(batch.map((book) => fetchBookMeta(book.title, book.author)));
        if (cancelled) return;
        setBooks((current) => current.map((book) => {
          const index = batch.findIndex((item) => item.id === book.id);
          return index >= 0 ? { ...book, ...results[index], loading: false } : book;
        }));
      }
    };
    void enrich();
    return () => { cancelled = true; };
    // Metadata enrichment is intentionally started once after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const completed = books.filter((book) => book.status === "Completed").length;
  const tbr = books.length - completed;
  const rhythm = books.length ? Math.round((completed / books.length) * 100) : 0;

  const visibleBooks = useMemo(() => {
    const normalized = query.toLowerCase();
    return books
      .filter((book) => shelf === "All" || book.status === shelf)
      .filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(normalized))
      .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "author" ? a.author.localeCompare(b.author) : b.addedAt - a.addedAt);
  }, [books, shelf, query, sort]);

  const toggleStatus = (id: string) => {
    const target = books.find((book) => book.id === id);
    if (!target) return;
    const isCompleting = target.status === "TBR";
    setBooks((current) => current.map((book) => book.id === id ? { ...book, status: isCompleting ? "Completed" : "TBR" } : book));
    if (isCompleting) {
      setCelebrating(id);
      window.setTimeout(() => setCelebrating(null), 900);
      toast.success("Another story finished!", { description: `${target.title} moved to Completed.` });
    } else toast("Back on your reading list", { description: target.title });
  };

  const removeBook = (book: Book) => {
    if (window.confirm(`Remove "${book.title}" from your nook?`)) {
      setBooks((current) => current.filter((item) => item.id !== book.id));
      if (book.hasPdf) void deletePdf(book.id);
      toast("Book removed", { description: book.title });
    }
  };

  const addBook = (book: Book) => {
    setBooks((current) => [book, ...current]);
    toast.success("Book tucked onto your shelf!", { description: book.title });
    if (!book.cover) {
      void fetchBookMeta(book.title, book.author).then((meta) => setBooks((current) => current.map((item) => item.id === book.id ? { ...item, ...meta, loading: false } : item)));
    }
  };

  const saveBook = (updated: Book) => {
    setBooks((current) => current.map((book) => book.id === updated.id ? { ...book, ...updated } : book));
    toast.success("Updated!", { description: `${updated.title} has been saved.` });
    if (!updated.cover) {
      void fetchBookMeta(updated.title, updated.author).then((meta) => setBooks((current) => current.map((item) => item.id === updated.id ? { ...item, ...meta, loading: false } : item)));
    }
  };

  const openPdf = async (bookId: string) => {
    try {
      const blob = await getPdf(bookId);
      if (!blob) { toast.error("PDF not found", { description: "The file may have been cleared." }); return; }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Revoke after a short delay to allow the tab to load
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error("Couldn't open PDF", { description: "Something went wrong reading from storage." });
    }
  };

  const handleEditOpen = (book: Book) => {
    setEditingBook(book);
  };

  const handleEditClose = (v: boolean) => {
    if (!v) setEditingBook(null);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-cream text-ink">
      <header className="site-header">
        <a href="#top" className="logo-mark" aria-label="The Book Nook home"><span>THE</span> BOOK NOOK <BookOpen /></a>
        <nav className="hidden items-center gap-8 md:flex"><a href="#shelves">My shelf</a><a href="#quote">Bookish wisdom</a></nav>
        <Button onClick={() => setModalOpen(true)} className="rounded-full border-2 border-ink bg-coral px-5 font-display text-ink shadow-button hover:bg-coral/90">+ Add a Book</Button>
      </header>

      <section id="top" className="hero-section">
        <div className="sticker sticker-star">✦</div><div className="sticker sticker-heart">♥</div><div className="sticker sticker-book">BOOK<br />LOVER</div>
        <ReaderIllustration side="left" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles /> A QUIET CORNER FOR YOUR STORIES</div>
          <h1>Your library,<br /><span>lately.</span></h1>
          <p>Keep every maybe, someday, and couldn't-put-it-down read in one happy little place.</p>
          <Button onClick={() => document.getElementById("shelves")?.scrollIntoView({ behavior: "smooth" })} className="hero-button">Browse my shelf <ChevronDown /></Button>
        </div>
        <ReaderIllustration side="right" />
      </section>

      <section className="stats-strip" aria-label="Reading statistics">
        {[
          { label: "Books in my nook", value: books.length, icon: Library, cls: "bg-coral-soft" },
          { label: "Waiting to be read", value: tbr, icon: BookOpen, cls: "bg-yellow" },
          { label: "Stories completed", value: completed, icon: Check, cls: "bg-sky" },
          { label: "Reading rhythm", value: `${rhythm}%`, icon: Sparkles, cls: "bg-mint" },
        ].map((stat) => <div className={`stat-tile ${stat.cls}`} key={stat.label}><stat.icon /><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
      </section>

      <section id="shelves" className="shelf-section">
        <div className="section-heading"><div><span className="eyebrow plain">MY BOOKSHELF</span><h2>What's on the <em>shelf?</em></h2></div><p>{visibleBooks.length} {visibleBooks.length === 1 ? "book" : "books"} in view</p></div>
        <div className="shelf-tools">
          <div className="shelf-tabs" role="tablist" aria-label="Book shelves">
            {(["All", "TBR", "Completed"] as Shelf[]).map((item) => <Button key={item} variant="ghost" role="tab" aria-selected={shelf === item} onClick={() => setShelf(item)} className={shelf === item ? "active" : ""}>{item === "TBR" ? "To Be Read" : item}</Button>)}
          </div>
          <label className="search-box"><Search /><span className="sr-only">Search books</span><Input aria-label="Search books" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or author…" />{query && <Button variant="ghost" size="icon" onClick={() => setQuery("")} aria-label="Clear search"><X /></Button>}</label>
          <label className="sort-box"><ArrowDownAZ /><span className="sr-only">Sort books</span><select aria-label="Sort books" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}><option value="recent">Recently added</option><option value="title">Title A–Z</option><option value="author">Author A–Z</option></select></label>
        </div>

        {visibleBooks.length ? <div className="book-grid">
          {visibleBooks.map((book, index) => (
            <article className="book-card" key={book.id}>
              <div className="cover-wrap">
                <span className={`status-badge ${book.status === "Completed" ? "is-complete" : ""}`}>{book.status}</span>
                {book.loading ? <div className="cover-skeleton" /> : book.cover ? <><img src={book.cover} alt={`Cover of ${book.title}`} onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }} /><div className="hidden h-full w-full"><BookPlaceholder title={book.title} tone={index} /></div></> : <div className="h-full w-full"><BookPlaceholder title={book.title} tone={index} /></div>}
              </div>
              <div className="book-info"><h3>{book.title}</h3><p className="author">by {book.author}</p><p className="description">{book.description.replace(/<[^>]*>/g, " ")}</p></div>
              <div className="card-actions">
                <Button onClick={() => toggleStatus(book.id)} className={book.status === "Completed" ? "status-action is-complete" : "status-action"}>{book.status === "Completed" ? <><BookOpen /> Move to TBR</> : <><Check /> Mark completed</>}</Button>
                <Button variant="ghost" size="icon" onClick={() => handleEditOpen(book)} aria-label={`Edit ${book.title}`} title="Edit book" className="card-icon-btn"><Pencil /></Button>
                <Button variant="ghost" size="icon" onClick={() => removeBook(book)} aria-label={`Remove ${book.title}`} title="Remove book" className="card-icon-btn card-icon-btn--danger"><Trash2 /></Button>
              </div>
              {book.hasPdf && (
                <div className="card-pdf-row">
                  <button type="button" className="pdf-pill" onClick={() => openPdf(book.id)}>
                    📄 Read PDF
                  </button>
                </div>
              )}
              {celebrating === book.id && <div className="confetti" aria-hidden="true">✦ <span>♥</span> ★ <b>✦</b> ●</div>}
            </article>
          ))}
        </div> : <div className="empty-shelf"><BookOpen /><h3>No stories here yet.</h3><p>Try another shelf or search, or add a new book.</p><Button onClick={() => setModalOpen(true)} className="hero-button">+ Add a Book</Button></div>}
      </section>

      <section id="quote" className="quote-section"><span className="giant-quote">"</span><div><p>A room without books is like a body without a soul.</p><span>— Marcus Tullius Cicero</span></div><svg viewBox="0 0 170 170" aria-hidden="true"><circle className="fill-yellow stroke-ink" cx="85" cy="86" r="59" strokeWidth="3" /><path className="fill-coral stroke-ink" strokeWidth="3" d="M47 115V53h61v62l-30-17Z" /><path className="stroke-ink" strokeWidth="4" strokeLinecap="round" d="M129 28l9-13m10 32 15-4m-31 7 9 9" /></svg></section>

      <section className="cta-band"><div><span className="eyebrow plain">ONE MORE CHAPTER?</span><h2>Add your next <em>great read.</em></h2><Button onClick={() => setModalOpen(true)} className="hero-button">Add a Book <BookHeart /></Button></div><div className="cta-stack"><BookPlaceholder title="Your next favorite" tone={3} /></div></section>
      <footer><a href="#top" className="logo-mark"><span>THE</span> BOOK NOOK <BookOpen /></a><p>Made for slow mornings, late nights, and very full shelves.</p><a href="#shelves">Back to my shelf ↑</a></footer>

      {/* Add book modal */}
      <BookModal open={modalOpen} onOpenChange={setModalOpen} onAdd={addBook} />

      {/* Edit book modal */}
      <BookModal
        open={!!editingBook}
        onOpenChange={handleEditClose}
        onSave={saveBook}
        editBook={editingBook}
      />
    </main>
  );
}