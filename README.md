# The Cozy Corner

Build Prompt: "The Book Nook" — Personal Reading Tracker (Playful Illustrated Style)

Build me a personal book-tracking website called "The Book Nook." No login needed — just my own reading dashboard. Keep all the functionality below, but the design must match the bold, playful, illustrated landing-page style described in the Design section — NOT a minimal muted card grid. Think "fun product landing page" energy, not "clean SaaS dashboard" energy.

🎨 Design & Visual Style (most important part — follow closely)

Match this reference style: a bright, flat-illustrated, "Memphis/Y2K" playful web design aesthetic — colorful blocked sections, chunky rounded typography, hand-drawn character illustrations, sticker-like decorative shapes, and punchy contrast. Specifically:

Color palette — candy-bright pastels on a white/cream base, NOT muted sage/beige tones:

Primary accent: a warm coral/pink (like #FF8FA3 or #FF6B8B)

Secondary blocks: buttery yellow (#FFE27A), soft sky blue (#AEE3F5), mint green (#B8E8C8), lavender (#D9C9F5)

Base background: white or warm cream (#FFF8F0)

Text: near-black (#1A1A1A) for headlines, not gray

Each section/card block should use a SOLID flat pastel background (not gradients), like distinct colored tiles sitting next to each other

Typography:

Big, bold, chunky headline font (rounded sans-serif like "Baloo 2," "Fredoka," or "Poppins Bold") — headlines should be large (48px+) with select words highlighted in the coral accent color, e.g. "Your library, lately." with "lately" in pink

Body text: clean, friendly sans-serif (Poppins/Inter), generous line height

Illustrations & decorative elements (this is what's currently missing entirely):

Use simple flat-vector illustrated characters/scenes — e.g. a person curled up reading in a cozy chair, a stack of books, a person carrying an armful of books — placed in the hero section flanking the headline, the way the reference has illustrated people on either side of the hero text

Scatter small decorative sticker shapes throughout: hearts, sparkles/stars, dashed circles behind headline text, small book-page or bookmark icons, soft cloud/blob shapes in the background

These can be simple inline SVGs — don't need to be photorealistic, just charming flat-illustration style matching the reference

Layout patterns to replicate:

Header: white background, bold logo on left, nav links, a solid pink pill-shaped "+ Add a Book" button on the right (like the reference's "Sign Up" button)

Hero section: centered, small pink eyebrow label above the headline (e.g. "A QUIET CORNER FOR YOUR STORIES"), big bold headline, subtext, flanked by illustrations and decorative shapes — NOT a bare left-aligned dashboard header

Stats strip: instead of 4 plain white cards, give each stat its own SOLID colored tile (one pink, one yellow, one blue, one mint) with a bold icon, big number, and label — like the reference's 3-color feature block row

Shelf tabs (All books / To Be Read / Completed): styled as a chunky pill-shaped tab group with a solid dark-green or coral active state, sitting on a white section

Book grid: each book card keeps a thick, slightly rounded border (2-3px, in a soft color or black), a solid pastel-colored placeholder area behind the cover art (never a plain gray/beige gradient — use the bright palette), a small colored "TBR" or "Completed" sticker badge in a corner (like a rounded pill tag), title in bold, author in a lighter weight. On hover, cards lift slightly with a playful shadow.

Quote/testimonial section: pull the sidebar quote ("A room without books is like a body without a soul") out of the thin sidebar and give it its own full-width colored section block with a large decorative quote mark, styled like the reference's testimonial block

Footer: solid dark section (deep green or near-black) with logo, nav links, and a colorful CTA banner above it if there's room (e.g. "Add your next great read" with an illustration, echoing the reference's bottom CTA banner)

General vibe check: every section should feel like a distinct colorful tile/block, illustrations should make it feel human and cozy (not corporate), and nothing should be a flat gray-beige gradient rectangle — replace ALL current book-cover placeholder gradients with either a real fetched cover OR a charming flat-illustrated placeholder (e.g. a little stack-of-books icon on a solid bright color background with the title beneath).

Functional Requirements (keep these — don't change the behavior, only the look)

Shelves

To Be Read (TBR) — unread books

Completed — finished books, with a "Mark as Completed" button on TBR cards that moves them here (small celebratory animation/confetti burst on click)

All books tab showing everything, plus filter pills for TBR / Completed

Search bar to filter by title/author

Each Book Card Shows

Cover image (real, fetched — see below)

Title, author, 2–3 sentence description

Status badge (TBR/Completed)

Toggle button to change status

Remove option (with confirmation)

Add New Book

A "+ Add a Book" button opens a modal asking for: cover image (upload, drag & drop, with preview), title, author, brief description, status (TBR/Completed dropdown). New book appears as a card immediately with a toast confirmation.

Data & Persistence

Store books in localStorage as {id, title, author, cover, description, status}. Uploaded covers stored as base64 data URLs so they persist across visits.

Real Book Cover & Description Fetching

Write a fetchBookMeta(title, author) helper that queries:

Primary: Google Books API — https://www.googleapis.com/books/v1/volumes?q=intitle:{TITLE}+inauthor:{AUTHOR} → use volumeInfo.imageLinks.thumbnail (upgrade to zoom=2, force https://) and volumeInfo.description

Fallback: Open Library — https://openlibrary.org/search.json?title={TITLE}&author={AUTHOR}

Cache results in localStorage so books aren't re-fetched every load

Show a shimmer/skeleton loading state on cards while fetching

If no cover art is found (common for very recent 2025/2026 releases), show the charming illustrated placeholder described in the Design section instead of a broken image

The 26 Books to Seed (title — author), all default to TBR status

Atmosphere: A Love Story — Taylor Jenkins Reid

Fake Skating — Lynn Painter

Heart the Lover — Lily King

In Your Dreams — Sarah Adams

Intermezzo — Sally Rooney

Normal People — Sally Rooney

Queen of Shadows — Sarah J. Maas

Strangers: A Memoir of Marriage — Belle Burden

The Correspondent — Virginia Evans

The Mating Game — Lana Ferguson

The Only One Left — Riley Sager

Tomorrow, and Tomorrow, and Tomorrow — Gabrielle Zevin

Where the Crawdads Sing — Delia Owens

Yesteryear — RWW Greene

Days at the Morisaki Bookshop — Satoshi Yagisawa

Wish I Could Tell You — Durjoy Datta

Fool Me Twice — Nona Uppal

The Match — Sarah Adams

400 Days — Chetan Bhagat

A Man Called Ove — Fredrik Backman

The Silent Patient — Alex Michaelides

The Lion Women of Tehran — Marjan Kamali

A Touch of Eternity — Durjoy Datta

Animal Farm — George Orwell

On the Open Road — Stuti Changle

Days at the Torunka Café — Satoshi Yagisawa (if the API doesn't return a match, leave as a manually-editable placeholder card)



Nice-to-haves

Stats tile shows a live percentage of "reading rhythm" (Completed ÷ total)

Sort by alphabetical / author / recently added

Small confetti or sparkle burst animation when a book is marked Completed

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c4734244-f766-4e8d-b41c-9c310a033e19).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
