# The Book Nook — Build Plan

## What I’ll build
- A single-page personal reading dashboard with a playful illustrated Memphis/Y2K look.
- A centered illustrated welcome area, colorful live stats, shelf controls, search, sorting, book cards, a quote band, and a dark footer CTA.
- Twenty-six preloaded TBR books, with browser-only persistence and no login.

## Visual direction
- Warm cream base with solid coral, yellow, sky, mint, and lavender blocks; near-black text and crisp dark outlines.
- Fredoka for bold rounded display type and Poppins for supporting text.
- Custom flat-vector reading characters and sticker-like stars, hearts, bookmarks, clouds, and book shapes.
- Thick borders, compact rounded corners, offset playful shadows, and restrained lift/sparkle motion.

## Interactions
- Shelf tabs for All, To Be Read, and Completed, plus search and sorting.
- Each book supports status changes and confirmed removal.
- Completing a book triggers a short celebratory burst and updates the live reading percentage.
- “Add a Book” opens a modal with cover upload/drag-and-drop preview, title, author, description, and status; submission shows a confirmation toast.

## Covers and persistence
- Store books and uploaded cover data in localStorage.
- Fetch metadata from Google Books, then Open Library as fallback, with results cached locally.
- Show loading skeletons during lookup and a bright illustrated book placeholder when no usable cover is found.

## Verification
- Check the finished page at desktop and mobile widths.
- Exercise search, tabs, sorting, add, completion, removal, persistence, and fallback cover states.
- Add route-specific title and social metadata for The Book Nook.
