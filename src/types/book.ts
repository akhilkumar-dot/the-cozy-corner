import type { DbBookRow } from "@/lib/supabase";

export type Status = "TBR" | "Reading" | "Completed";
export type Shelf = "All" | "TBR" | "Completed";
export type SortMode = "recent" | "title" | "author";
export type HeroPickerMode = "current" | "up-next" | null;
export type BookRating = number;

export function isBookRating(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5;
}

export function normalizeBookRating(value: number): number {
  const clamped = Math.max(0, Math.min(5, value));
  return Math.round(clamped * 10) / 10;
}

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
  rating?: number | null | undefined;
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
