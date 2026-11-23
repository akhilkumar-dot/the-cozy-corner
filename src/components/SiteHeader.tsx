import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useBooks } from "@/context/BooksContext";

export function SiteHeader({ activePage = "home" }: { activePage?: "home" | "shelf" }) {
  const { handleMigrate, migrating, migrationStatus, setModalOpen } = useBooks();

  return (
    <header className="site-header">
      <Link to="/" className="logo-mark" aria-label="The Book Nook home">
        <span className="logo-icon-box">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </span>
        The Book Nook.
      </Link>
      <nav>
        <Link
          to="/shelf"
          className={
            activePage === "shelf" ? "text-yellow font-extrabold underline underline-offset-4" : ""
          }
        >
          My shelf
        </Link>
        <a href={activePage === "shelf" ? "#quote" : "/shelf#quote"}>Bookish wisdom</a>
        {isSupabaseConfigured && (
          <button
            type="button"
            onClick={() => void handleMigrate()}
            disabled={migrating}
            title="Click to sync all local books, custom covers, and PDFs to Supabase cloud"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-ink uppercase bg-yellow hover:bg-yellow/90 px-2.5 py-1 rounded-full border border-ink shadow-[1px_1px_0_var(--ink)] cursor-pointer transition-all disabled:opacity-75"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${migrating ? "bg-coral animate-ping" : "bg-green animate-pulse"}`}
            />
            {migrating ? migrationStatus || "Syncing..." : "+ CLOUD SYNC"}
          </button>
        )}
      </nav>

      <Button
        onClick={() => setModalOpen(true)}
        className="rounded-full border-2 border-ink bg-yellow px-3 md:px-5 font-display text-ink shadow-button hover:bg-white text-sm md:text-base whitespace-nowrap font-bold"
      >
        + Add a Book
      </Button>
    </header>
  );
}
