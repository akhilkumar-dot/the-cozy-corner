/**
 * migrateToSupabase.ts
 *
 * Migrates all locally-stored Book Nook data — metadata (localStorage & IndexedDB),
 * base64 cover images, and PDFs (IndexedDB) — into Supabase.
 *
 * - Uploads base64 covers to Supabase Storage ('book-covers' bucket)
 * - Uploads IndexedDB PDFs to Supabase Storage ('book-pdfs' bucket)
 * - Upserts all book records to the 'books' table in PostgreSQL
 * - Updates local records with clean public URLs to free local storage quota
 * - Safe to re-run: idempotent upserts
 */

import { getPdf } from "./pdfStore";
import {
  isSupabaseConfigured,
  supabase,
  uploadCoverToStorage,
  type DbBookRow,
} from "./supabase";

const BOOKS_KEY = "book-nook-books-v1";
const MIGRATION_FLAG = "book-nook-migrated-to-supabase-v1";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  status: "TBR" | "Completed";
  genre?: string;
  addedAt: number;
  loading?: boolean;
  hasPdf?: boolean;
  pdfFileName?: string | null;
  pdfFileSize?: number | null;
}

export interface MigrationProgress {
  phase: "reading" | "covers" | "pdfs" | "rows" | "done";
  current: number;
  total: number;
  currentTitle?: string;
}

export interface MigrationResult {
  totalBooks: number;
  rowsUpserted: number;
  coversUploaded: number;
  pdfsUploaded: number;
  failed: { id: string; title: string; stage: string; error: string }[];
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const meta = parts[0] || "";
  const base64 = parts[1] || "";
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function runBatched<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  async function next(): Promise<void> {
    const i = cursor++;
    if (i >= items.length) return;
    await worker(items[i], i);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

export async function migrateEverythingToSupabase(
  onProgress?: (p: MigrationProgress) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalBooks: 0,
    rowsUpserted: 0,
    coversUploaded: 0,
    pdfsUploaded: 0,
    failed: [],
  };

  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }

  // 1. Read metadata from localStorage
  const raw = localStorage.getItem(BOOKS_KEY);
  if (!raw) return result;

  let books: Book[] = [];
  try {
    books = JSON.parse(raw) as Book[];
  } catch {
    return result;
  }

  result.totalBooks = books.length;
  onProgress?.({ phase: "reading", current: 0, total: books.length });

  const updatedBooks: Book[] = [...books];

  // 2. Process each book: upload cover if base64, upload PDF if in IndexedDB, upsert row
  await runBatched(books, 3, async (book, i) => {
    const stageLabel = book.title || book.id;
    try {
      // -- Cover Handling --
      let coverUrl = book.cover || "";
      if (book.cover && book.cover.startsWith("data:")) {
        onProgress?.({
          phase: "covers",
          current: i + 1,
          total: books.length,
          currentTitle: stageLabel,
        });
        const coverBlob = dataUrlToBlob(book.cover);
        const uploadedUrl = await uploadCoverToStorage(book.id, coverBlob);
        if (uploadedUrl) {
          coverUrl = uploadedUrl;
          result.coversUploaded++;
        }
      }

      // -- PDF Handling --
      let hasPdf = Boolean(book.hasPdf);
      let pdfStoragePath: string | null = null;
      if (hasPdf) {
        onProgress?.({
          phase: "pdfs",
          current: i + 1,
          total: books.length,
          currentTitle: stageLabel,
        });
        const pdfBlob = await getPdf(book.id);
        if (pdfBlob) {
          const path = `${book.id}.pdf`;
          const { error: pdfErr } = await supabase.storage
            .from("book-pdfs")
            .upload(path, pdfBlob, { upsert: true, contentType: "application/pdf" });
          if (!pdfErr) {
            pdfStoragePath = path;
            result.pdfsUploaded++;
          } else {
            console.warn(`PDF upload failed for ${book.title}:`, pdfErr.message);
          }
        }
      }

      // -- Database Row Upsert --
      onProgress?.({
        phase: "rows",
        current: i + 1,
        total: books.length,
        currentTitle: stageLabel,
      });

      const row: DbBookRow = {
        id: book.id,
        title: book.title,
        author: book.author,
        cover: coverUrl,
        description: book.description || "",
        status: book.status || "TBR",
        genre: book.genre || "Fiction",
        added_at: book.addedAt || Date.now(),
        has_pdf: hasPdf,
        pdf_file_name: book.pdfFileName || null,
        pdf_file_size: book.pdfFileSize || null,
        pdf_storage_path: pdfStoragePath,
      };

      const { error: rowErr } = await supabase
        .from("books")
        .upsert(row, { onConflict: "id" });

      if (rowErr) {
        throw new Error(`Row upsert failed: ${rowErr.message}`);
      }

      result.rowsUpserted++;

      // Update in-memory copy with clean URLs (freeing base64 space)
      updatedBooks[i] = {
        ...book,
        cover: coverUrl,
      };
    } catch (err) {
      result.failed.push({
        id: book.id,
        title: stageLabel,
        stage: "migration",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 3. Save lightweight books back to localStorage & mark migration complete
  try {
    localStorage.setItem(
      BOOKS_KEY,
      JSON.stringify(updatedBooks.map((b) => ({ ...b, loading: false })))
    );
    localStorage.setItem(MIGRATION_FLAG, "true");
  } catch (err) {
    console.warn("Could not rewrite localStorage with cleaned URLs:", err);
  }

  onProgress?.({ phase: "done", current: books.length, total: books.length });
  return result;
}
