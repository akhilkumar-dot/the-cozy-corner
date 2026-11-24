import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Menu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useBooks } from "@/context/BooksContext";
import { HeaderScallop, NookStackedLogo } from "@/components/NookDesign";

export function SiteHeader({ activePage = "home" }: { activePage?: "home" | "shelf" }) {
  const { handleMigrate, migrating, migrationStatus, setModalOpen, books } = useBooks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="dds-site-header">
      <div className="dds-header-inner">
        {/* Left: Hamburger (< 640px) or Desktop/Tablet Nav Links (>= 640px) */}
        <div className="flex-1 lg:flex-none flex items-center min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="sm:hidden inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full border border-[#103A4E]/15 bg-white text-[#103A4E] shadow-xs cursor-pointer transition-colors hover:bg-[#FCE172]"
          >
            {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          <nav className="dds-nav hidden sm:flex" aria-label="Primary navigation">
            <Link to="/" className={`dds-nav-link ${activePage === "home" ? "is-active" : ""}`}>
              HOME
            </Link>
            <Link
              to="/shelf"
              className={`dds-nav-link ${activePage === "shelf" ? "is-active" : ""}`}
            >
              MY SHELF
            </Link>
          </nav>
        </div>

        {/* Center Stacked Playful Logo */}
        <div className="dds-header-center shrink-0">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex items-center group"
            aria-label="The Book Nook home"
          >
            <NookStackedLogo size="md" />
          </Link>
        </div>

        {/* Right Action Pills */}
        <div className="dds-header-right flex-1 lg:flex-none min-w-0">
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => void handleMigrate()}
              disabled={migrating}
              title="Click to sync all local books, custom covers, and PDFs to Supabase cloud"
              className="hidden md:inline-flex items-center gap-1.5 text-[0.66rem] font-extrabold text-[#103A4E] uppercase bg-[#FCE172] hover:bg-[#f7d44d] px-2.5 py-1.5 rounded-full border border-[#103A4E]/15 shadow-xs cursor-pointer transition-all disabled:opacity-75 whitespace-nowrap"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  migrating ? "bg-[#F47A3C] animate-ping" : "bg-emerald-600 animate-pulse"
                }`}
              />
              {migrating ? migrationStatus || "Syncing..." : "SYNC"}
            </button>
          )}

          {/* Second pill shown only on lg+ (1024px+) to keep tablet & mobile headers clean */}
          <Link to="/shelf" className="dds-pill-btn dds-pill-navy hidden lg:inline-flex">
            <span className="dds-pill-icon">
              <BookOpen size={13} />
            </span>
            <span className="dds-pill-copy">
              <small>Browse All {books.length}</small>
              <strong>MY SHELF</strong>
            </span>
          </Link>

          <Button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setModalOpen(true);
            }}
            className="dds-pill-btn dds-pill-navy dds-pill-compact-mobile"
          >
            <span className="dds-pill-icon">
              <Plus size={14} />
            </span>
            <span className="dds-pill-copy">
              <small className="hidden xl:block">Track Your Next Read</small>
              <strong>ADD BOOK</strong>
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer (< 640px) */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#FAF5E8] border-t border-[#103A4E]/10 px-4 py-3 relative z-30 shadow-md">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-display font-bold text-sm transition-colors ${
                activePage === "home"
                  ? "bg-[#F47A3C] text-white"
                  : "bg-white/90 text-[#103A4E] hover:bg-white"
              }`}
            >
              <span>Home</span>
              <span className="text-xs opacity-80">Overview</span>
            </Link>
            <Link
              to="/shelf"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-display font-bold text-sm transition-colors ${
                activePage === "shelf"
                  ? "bg-[#F47A3C] text-white"
                  : "bg-white/90 text-[#103A4E] hover:bg-white"
              }`}
            >
              <span>My Shelf</span>
              <span className="text-xs opacity-80">{books.length} books</span>
            </Link>
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => {
                  void handleMigrate();
                  setMobileMenuOpen(false);
                }}
                disabled={migrating}
                className="flex items-center justify-between px-4 py-2.5 rounded-2xl font-display font-bold text-sm bg-[#FCE172] text-[#103A4E] cursor-pointer disabled:opacity-75"
              >
                <span>{migrating ? migrationStatus || "Syncing..." : "Cloud Sync"}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    migrating ? "bg-[#F47A3C] animate-ping" : "bg-emerald-600"
                  }`}
                />
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Gentle Cream Scallop Edge dripping below the header */}
      <HeaderScallop />
    </header>
  );
}
