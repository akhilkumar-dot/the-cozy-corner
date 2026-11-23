import type { DbBookRow } from "@/lib/supabase";

export type Status = "TBR" | "Reading" | "Completed";
export type Shelf = "All" | "TBR" | "Completed";
export type SortMode = "recent" | "title" | "author";
export type HeroPickerMode = "current" | "up-next" | null;

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  status: Status;
  addedAt: number;
  loading?: boolean | undefined;
  hasPdf?: boolean | undefined;
  pdfFileName?: string | null | undefined;
  pdfFileSize?: number | null | undefined;
  genre?: string | undefined;
};

export type BookMeta = {
  cover: string | null;
  description: string | null;
  genre: string | null;
};

export const GENRE_OPTIONS = [
  "Fiction",
  "Romance",
  "Mystery & Thriller",
  "Sci-Fi & Fantasy",
  "Classics",
  "Cozy Fiction",
  "Historical Fiction",
  "Literary Fiction",
  "Memoir & Biography",
  "Young Adult",
  "Self-Help",
  "Non-Fiction",
  "Other",
] as const;
