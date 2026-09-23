# 📚 The Book Nook

*A quiet corner for your stories.*

A cozy, personal reading tracker to keep every maybe, someday, and couldn't-put-it-down read in one happy little place. Track what's on your shelf, mark books as completed, and add new finds — all wrapped in a warm, illustrated, no-login-needed interface.

![The Book Nook screenshot](./screenshot.png)

## ✨ Features

- **Personal library dashboard** — see your whole collection at a glance, with live stats for books in your nook, waiting to be read, stories completed, and your reading rhythm (% completed)
- **Shelves & filtering** — toggle between All, To Be Read, and Completed, or search by title/author
- **One-click status updates** — "Mark completed" / "Move to TBR" buttons move books between shelves instantly
- **Add a Book** — upload a cover image, title, author, and a brief description for any new book you want to track
- **Real book data** — covers and descriptions for the seeded library are fetched live from the Google Books API (with an Open Library fallback), so you're looking at real book art, not placeholders
- **Persistent storage** — your shelf, statuses, and any books you add are saved locally in your browser, so everything's still there next time you visit
- **Playful, illustrated design** — hand-drawn style accents, a bright color-blocked layout, and a little literary wisdom section for good measure

## 🛠️ Tech Stack

- HTML, CSS, and vanilla JavaScript — a single self-contained file, no build step or framework required
- [Google Books API](https://developers.google.com/books) for cover images and descriptions, with [Open Library](https://openlibrary.org/dev/docs/api/search) as a fallback
- Browser `localStorage` for persistence (book list, statuses, and uploaded cover images as base64)
- Google Fonts for the rounded headline and body typefaces

## 🚀 Getting Started

No installation or dependencies needed.

1. Clone the repo
   ```bash
   git clone https://github.com/<your-username>/the-book-nook.git
   cd the-book-nook
   ```
2. Open `index.html` directly in your browser, **or** serve it locally:
   ```bash
   npx serve .
   ```
3. Start browsing your shelf — books load with live cover art on first run and cache afterward.

## 📖 Usage

- Click **+ Add a Book** in the header (or the footer CTA) to add a new title — you'll be asked for a cover image, title, author, and a short blurb.
- Use the **All / To Be Read / Completed** tabs, or the search bar, to find a book quickly.
- Click **Mark completed** on any TBR card to move it to your finished shelf (or **Move to TBR** to send it back).
- Use the trash icon on a card to remove a book from your shelf.

## 🗂️ Project Structure

```
the-book-nook/
├── index.html      # everything — markup, styles, and app logic
├── screenshot.png  # preview image used in this README
└── README.md
```

## 🔮 Roadmap Ideas

- Sort by alphabetical / author / recently added
- Reading progress notes or star ratings per book
- Export/import your shelf as JSON
- Optional cloud sync for use across devices

## 🙏 Credits

> "A room without books is like a body without a soul."
> — Marcus Tullius Cicero

Book data and cover art via the Google Books API and Open Library.

## 📄 License

[MIT](./LICENSE) — made for slow mornings, late nights, and very full shelves.
