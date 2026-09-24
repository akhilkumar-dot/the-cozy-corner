const DB_NAME = "book-nook-pdfs";
const STORE_NAME = "pdfs";
const BOOKS_STORE = "books_data";
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePdf(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPdf(id: string): Promise<Blob | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePdf(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Store all books in IndexedDB (has GBs of quota, never hits 5MB localStorage limit) */
export async function saveBooksToIndexedDb(books: unknown[]): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, "readwrite");
      tx.objectStore(BOOKS_STORE).put(books, "all_books");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed saving books to IndexedDB:", err);
  }
}

/** Load all books from IndexedDB */
export async function loadBooksFromIndexedDb<T>(): Promise<T[] | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(BOOKS_STORE, "readonly");
      const request = tx.objectStore(BOOKS_STORE).get("all_books");
      request.onsuccess = () => resolve((request.result as T[]) || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
