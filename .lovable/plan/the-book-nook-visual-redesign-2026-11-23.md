# The Book Nook visual redesign

## What will change

- Rework the home page into a book-focused composition inspired by the reference: a vivid orange opening band, soft cyan wave sections, crisp white reading areas, deep teal text, and tactile navy buttons.
- Keep the reference’s lively storefront layout while removing food, ordering, menu, and location content that does not belong in a reading tracker.
- Carry the same palette and visual language through the bookshelf, book cards, shared header, and book dialogs.
- Keep the existing book data, current-read and up-next selectors, stats, search, filters, add/edit/remove actions, and reading controls intact.
- Use the reader’s real book covers and existing illustrated fallbacks as the page’s imagery.

## Technical details

- Update semantic palette tokens and focused page styles in `src/styles.css`.
- Adjust the home page and shared header markup only where needed to support the reference-inspired sections and navigation.
- Verify the preview at desktop and mobile sizes, check for overflow, and exercise the current-read/up-next controls and bookshelf navigation.
