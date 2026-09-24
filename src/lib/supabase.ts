import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type DbBookRow = {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  status: "TBR" | "Completed";
  genre: string;
  added_at: number;
  has_pdf: boolean;
  pdf_file_name: string | null;
  pdf_file_size: number | null;
  pdf_storage_path: string | null;
  created_at?: string;
};

export async function fetchBooksFromDb(): Promise<DbBookRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) {
    console.error("Error fetching books from Supabase:", error);
    return null;
  }
  return data as DbBookRow[];
}

export async function saveBookToDb(bookRow: DbBookRow): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("books")
    .upsert(bookRow, { onConflict: "id" });

  if (error) {
    console.error("Error saving book to Supabase:", error);
    return false;
  }
  return true;
}

export async function deleteBookFromDb(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    console.error("Error deleting book from Supabase:", error);
    return false;
  }
  return true;
}

export async function seedBooksInDb(books: DbBookRow[]): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("books").upsert(books, { onConflict: "id" });
  if (error) {
    console.error("Error seeding books to Supabase:", error);
    return false;
  }
  return true;
}

export async function uploadPdfToStorage(bookId: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  const path = `${bookId}.pdf`;
  const { error } = await supabase.storage.from("book-pdfs").upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (error) {
    console.error("Failed to upload PDF to Supabase Storage:", error);
    return null;
  }
  return path;
}

export async function getPdfUrlFromStorage(bookId: string): Promise<string | null> {
  if (!supabase) return null;
  const path = `${bookId}.pdf`;
  const { data } = supabase.storage.from("book-pdfs").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function deletePdfFromStorage(bookId: string): Promise<void> {
  if (!supabase) return;
  const path = `${bookId}.pdf`;
  await supabase.storage.from("book-pdfs").remove([path]);
}

export async function uploadCoverToStorage(bookId: string, blob: Blob): Promise<string | null> {
  if (!supabase) return null;
  const path = `${bookId}.jpg`;
  const { error } = await supabase.storage.from("book-covers").upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg",
  });
  if (error) {
    console.error("Failed to upload cover to Supabase Storage:", error);
    return null;
  }
  const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function getCoverUrlFromStorage(bookId: string): Promise<string | null> {
  if (!supabase) return null;
  const path = `${bookId}.jpg`;
  const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function deleteCoverFromStorage(bookId: string): Promise<void> {
  if (!supabase) return;
  const path = `${bookId}.jpg`;
  await supabase.storage.from("book-covers").remove([path]);
}
