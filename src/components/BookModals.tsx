import React, { useRef, useState, useEffect, type FormEvent } from "react";
import {
  BookHeart,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deletePdf, savePdf } from "@/lib/pdfStore";
import { GENRE_OPTIONS, type Book, type Status } from "@/types/book";
import {
  compressImageFile,
  defaultDescription,
  formatBytes,
  PDF_SIZE_WARN,
  useBooks,
} from "@/context/BooksContext";

type PdfState = {
  file: File | null;
  existingName: string | null;
  existingSize: number | null;
  removed: boolean;
};

export function PdfUploader({
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

  const displayName = pdfState.file?.name ?? (!pdfState.removed ? pdfState.existingName : null);
  const displaySize = pdfState.file?.size ?? (!pdfState.removed ? pdfState.existingSize : null);
  const hasFile = !!displayName;
  const isLarge = displaySize != null && displaySize > PDF_SIZE_WARN;

  const clear = () => {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange({
      file: null,
      existingName: pdfState.existingName,
      existingSize: pdfState.existingSize,
      removed: true,
    });
  };

  return (
    <div className="pdf-uploader-wrap">
      {!hasFile ? (
        <button
          type="button"
          className={`pdf-upload-zone${dragging ? " is-dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
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
          <button
            type="button"
            className="pdf-clear-btn"
            onClick={clear}
            aria-label="Remove PDF attachment"
          >
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
      {error && (
        <p className="pdf-error" role="alert">
          {error}
        </p>
      )}
      {isLarge && !error && (
        <p className="pdf-warning">⚠ Large PDFs may slow things down — under 10 MB works best.</p>
      )}
    </div>
  );
}

export type BookModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd?: (book: Book, pdfFile?: File | null) => void;
  onSave?: (book: Book, pdfFile?: File | null, pdfRemoved?: boolean) => void;
  editBook?: Book | null;
};

export function BookModal({ open, onOpenChange, onAdd, onSave, editBook }: BookModalProps) {
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

  useEffect(() => {
    if (!open) return;
    if (isEdit && editBook) {
      setCover(editBook.cover ?? "");
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

  const readImageFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) setCover(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setCover(typeof reader.result === "string" ? reader.result : "");
      reader.readAsDataURL(file);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const author = String(data.get("author") ?? "").trim();
    if (!title || !author) return;

    const id = isEdit && editBook ? editBook.id : crypto.randomUUID();

    let hasPdf = false;
    let pdfFileName: string | null = null;
    let pdfFileSize: number | null = null;

    if (pdfState.file) {
      await savePdf(id, pdfState.file);
      hasPdf = true;
      pdfFileName = pdfState.file.name;
      pdfFileSize = pdfState.file.size;
    } else if (pdfState.removed) {
      await deletePdf(id);
      hasPdf = false;
      pdfFileName = null;
      pdfFileSize = null;
    } else if (isEdit && editBook?.hasPdf && !pdfState.removed) {
      hasPdf = true;
      pdfFileName = editBook.pdfFileName ?? null;
      pdfFileSize = editBook.pdfFileSize ?? null;
    }

    const rawStatus = data.get("status");
    const status: Status =
      rawStatus === "Completed" ? "Completed" : rawStatus === "Reading" ? "Reading" : "TBR";
    const genre = String(data.get("genre") ?? "Fiction").trim() || "Fiction";

    const book: Book = {
      id,
      title,
      author,
      description: String(data.get("description") ?? "").trim() || defaultDescription,
      status,
      cover,
      addedAt: isEdit && editBook ? editBook.addedAt : Date.now(),
      loading: !cover && !isEdit,
      hasPdf,
      pdfFileName,
      pdfFileSize,
      genre,
    };

    if (isEdit) {
      onSave?.(book, pdfState.file, pdfState.removed);
    } else {
      onAdd?.(book, pdfState.file);
    }

    form?.reset();
    setCover("");
    setPdfState({ file: null, existingName: null, existingSize: null, removed: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dds-dialog w-[calc(100vw-1.5rem)] sm:w-full max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-[#103A4E]">
            {isEdit ? "Edit this adventure" : "Add a new adventure"}
          </DialogTitle>
          <DialogDescription className="text-[#103A4E]/75 font-medium">
            {isEdit
              ? "Update the details below. Your changes save in place."
              : "Pop in the details now. We'll look for a cover if you don't add one."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <button
            type="button"
            className={`upload-zone ${dragging ? "is-dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              readImageFile(event.dataTransfer.files[0]);
            }}
          >
            {cover ? (
              <img src={cover} alt="Book cover preview" />
            ) : (
              <>
                <ImagePlus />
                <strong>Drop a cover here</strong>
                <span>or click to browse</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => readImageFile(e.target.files?.[0])}
          />

          <PdfUploader pdfState={pdfState} onChange={setPdfState} />

          <label className="field-label">
            Title
            <Input
              aria-label="Book title"
              name="title"
              required
              placeholder="The book title"
              defaultValue={isEdit ? editBook?.title : undefined}
              key={`title-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <label className="field-label">
            Author
            <Input
              aria-label="Book author"
              name="author"
              required
              placeholder="Who wrote it?"
              defaultValue={isEdit ? editBook?.author : undefined}
              key={`author-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <label className="field-label">
            A tiny note
            <Textarea
              name="description"
              rows={3}
              placeholder="What caught your eye?"
              defaultValue={
                isEdit && editBook?.description !== defaultDescription
                  ? editBook?.description
                  : undefined
              }
              key={`desc-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="field-label">
              Shelf
              <select
                name="status"
                className="form-select"
                defaultValue={isEdit ? editBook?.status : "TBR"}
                key={`status-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
              >
                <option value="TBR">To Be Read</option>
                <option value="Reading">Currently Reading</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="field-label">
              Genre
              <select
                name="genre"
                className="form-select"
                defaultValue={isEdit ? (editBook?.genre ?? "Fiction") : "Fiction"}
                key={`genre-${editBook?.id ?? "new"}-${open ? "open" : "closed"}`}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button type="submit" className="dds-modal-submit">
            {isEdit ? (
              <>
                Save Changes <Check size={16} />
              </>
            ) : (
              <>
                Add to my nook <BookHeart size={16} />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BooksSharedModals() {
  const {
    books,
    modalOpen,
    setModalOpen,
    editingBook,
    setEditingBook,
    bookToDelete,
    setBookToDelete,
    confirmDeleteBook,
    heroPickerMode,
    setHeroPickerMode,
    currentBook,
    upNextIds,
    chooseCurrentRead,
    toggleUpNext,
    addBook,
    saveBook,
  } = useBooks();

  return (
    <>
      {/* Add book modal */}
      <BookModal open={modalOpen} onOpenChange={setModalOpen} onAdd={addBook} />

      {/* Edit book modal */}
      <BookModal
        open={!!editingBook}
        onOpenChange={(v) => {
          if (!v) setEditingBook(null);
        }}
        onSave={saveBook}
        editBook={editingBook}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={bookToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBookToDelete(null);
        }}
      >
        <DialogContent className="dds-dialog w-[calc(100vw-1.5rem)] sm:w-full max-w-md p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#F47A3C]/40 bg-[#F47A3C]/15 text-[#F47A3C]">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-xl font-bold text-[#103A4E]">
                Remove from your nook?
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-[#103A4E]/75 leading-relaxed">
                Are you sure you want to remove{" "}
                <strong className="text-[#103A4E] font-bold">"{bookToDelete?.title}"</strong>
                {bookToDelete?.author ? ` by ${bookToDelete.author}` : ""}? This cannot be undone.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="mt-5 flex flex-row items-center justify-end gap-2.5 sm:gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBookToDelete(null)}
              className="h-10 rounded-full border-2 border-[#103A4E]/20 bg-white px-4 font-display font-bold text-[#103A4E] hover:bg-[#FCE172]/40 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteBook}
              className="h-10 rounded-full bg-[#F47A3C] hover:bg-[#d96126] px-5 font-display font-bold text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 size={15} /> Yes, remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Picker (Choose current read / up next) dialog */}
      <Dialog
        open={heroPickerMode !== null}
        onOpenChange={(open) => {
          if (!open) setHeroPickerMode(null);
        }}
      >
        <DialogContent className="dds-dialog hero-picker-dialog w-[calc(100vw-1.5rem)] sm:w-full max-h-[86vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-[#103A4E]">
              {heroPickerMode === "current" ? "Choose your current read" : "Choose what’s up next"}
            </DialogTitle>
            <DialogDescription className="text-[#103A4E]/75 font-medium">
              {heroPickerMode === "current"
                ? "Pick one book to feature at the top of your nook."
                : "Pick up to three books and arrange your immediate reading queue."}
            </DialogDescription>
          </DialogHeader>
          <div className="hero-picker-list">
            {books.filter((b) => b.status !== "Completed").length === 0 ? (
              <p className="p-6 text-center text-sm text-[#103A4E]/65">
                All books in your library are completed! Add more books to arrange your reading
                queue.
              </p>
            ) : (
              books
                .filter((book) => book.status !== "Completed")
                .map((book) => {
                  const selected =
                    heroPickerMode === "current"
                      ? currentBook?.id === book.id
                      : upNextIds.includes(book.id);
                  return (
                    <Button
                      key={book.id}
                      type="button"
                      variant="ghost"
                      className={`hero-picker-option ${selected ? "is-selected" : ""}`}
                      onClick={() =>
                        heroPickerMode === "current"
                          ? chooseCurrentRead(book)
                          : toggleUpNext(book.id)
                      }
                    >
                      <span className="hero-picker-cover">
                        {book.cover ? (
                          <img src={book.cover} alt="" />
                        ) : (
                          <BookOpen aria-hidden="true" />
                        )}
                      </span>
                      <span className="hero-picker-copy">
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </span>
                      <span className="hero-picker-check" aria-hidden="true">
                        {selected ? <Check /> : <ChevronRight />}
                      </span>
                    </Button>
                  );
                })
            )}
          </div>
          {heroPickerMode === "up-next" && (
            <p className="hero-picker-count">{upNextIds.length} of 3 selected</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
