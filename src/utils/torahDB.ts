import { Sefer } from "@/types/torah";

const DB_NAME = 'torah_local_db';
const DB_VERSION = 3;
const SEFER_STORE = 'sefarim';
const META_STORE = 'metadata';
const USER_DATA_STORE = 'user_data';
const COMMENTARY_STORE = 'commentaries';
const DATA_VERSION = '1.0.0'; // Bump when JSON data structure changes

interface SeferEntry {
  seferId: number;
  data: Sefer;
  timestamp: number;
  version: string;
  sizeBytes: number;
}

interface MetaEntry {
  key: string;
  value: Record<string, unknown> | string | number | boolean | null;
}

interface UserDataEntry {
  key: string; // e.g. "highlights", "notes", "bookmarks", "content", "questions", "answers", "titles"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
  userId: string;
}

interface CommentaryEntry {
  key: string; // e.g. "Rashi-Genesis" or "Rashi-Genesis-1-1"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
}

/**
 * High-performance local IndexedDB storage for ALL Torah app data.
 * 
 * Stores:
 * - sefarim: Full Torah text (5 books, ~8-16MB each)
 * - user_data: User highlights, notes, bookmarks, content (from Supabase)
 * - commentaries: Sefaria commentary data (from local files + API)
 * - metadata: App-level key-value storage
 * 
 * Strategy: Load from local DB first (instant), sync with cloud in background.
 * Falls back gracefully if IndexedDB is unavailable.
 */
class TorahLocalDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isAvailable = true;

  async init(): Promise<void> {
    if (this.db) return;
    if (!this.isAvailable) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn('[TorahDB] IndexedDB not available, using memory only');
          this.isAvailable = false;
          resolve();
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.db.onerror = (e) => {
            console.error('[TorahDB] Database error:', e);
          };
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(SEFER_STORE)) {
            db.createObjectStore(SEFER_STORE, { keyPath: 'seferId' });
          }
          if (!db.objectStoreNames.contains(META_STORE)) {
            db.createObjectStore(META_STORE, { keyPath: 'key' });
          }
          // New stores for full data caching
          if (!db.objectStoreNames.contains(USER_DATA_STORE)) {
            db.createObjectStore(USER_DATA_STORE, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(COMMENTARY_STORE)) {
            db.createObjectStore(COMMENTARY_STORE, { keyPath: 'key' });
          }
        };
      } catch {
        this.isAvailable = false;
        resolve();
      }
    });

    return this.initPromise;
  }

  // ==================== SEFARIM (Torah text) ====================

  async getSefer(seferId: number): Promise<Sefer | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(SEFER_STORE, 'readonly');
        const store = tx.objectStore(SEFER_STORE);
        const request = store.get(seferId);

        request.onsuccess = () => {
          const entry = request.result as SeferEntry | undefined;
          if (!entry) { resolve(null); return; }
          if (entry.version !== DATA_VERSION) { resolve(null); return; }
          console.log(`[TorahDB] ✅ Sefer ${seferId} from local DB (${(entry.sizeBytes / 1024 / 1024).toFixed(1)}MB)`);
          resolve(entry.data);
        };
        request.onerror = () => resolve(null);
      });
    } catch { return null; }
  }

  async saveSefer(seferId: number, data: Sefer): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      const jsonSize = JSON.stringify(data).length;

      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(SEFER_STORE, 'readwrite');
        const store = tx.objectStore(SEFER_STORE);
        const entry: SeferEntry = { seferId, data, timestamp: Date.now(), version: DATA_VERSION, sizeBytes: jsonSize };
        const request = store.put(entry);
        request.onsuccess = () => { console.log(`[TorahDB] 💾 Saved sefer ${seferId} (${(jsonSize / 1024 / 1024).toFixed(1)}MB)`); resolve(); };
        request.onerror = () => reject(request.error);
      });
    } catch (error) { console.warn('[TorahDB] Save sefer error:', error); }
  }

  async getStoredSefarim(): Promise<{ seferId: number; timestamp: number; sizeMB: number }[]> {
    try {
      await this.init();
      if (!this.db) return [];
      return new Promise((resolve) => {
        const tx = this.db!.transaction(SEFER_STORE, 'readonly');
        const store = tx.objectStore(SEFER_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
          const entries = (request.result as SeferEntry[]) || [];
          resolve(entries.map(e => ({ seferId: e.seferId, timestamp: e.timestamp, sizeMB: Math.round(e.sizeBytes / 1024 / 1024 * 10) / 10 })));
        };
        request.onerror = () => resolve([]);
      });
    } catch { return []; }
  }

  async deleteSefer(seferId: number): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(SEFER_STORE, 'readwrite');
        const request = tx.objectStore(SEFER_STORE).delete(seferId);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  // ==================== USER DATA (highlights, notes, bookmarks, content) ====================

  /**
   * Get cached user data by category.
   * Categories: "highlights", "notes", "personal_questions", "bookmarks", "titles", "questions", "answers"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserData(category: string, userId: string): Promise<any | null> {
    try {
      await this.init();
      if (!this.db) return null;
      const key = `${userId}:${category}`;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(USER_DATA_STORE, 'readonly');
        const store = tx.objectStore(USER_DATA_STORE);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result as UserDataEntry | undefined;
          if (!entry) { resolve(null); return; }
          console.log(`[TorahDB] ✅ User ${category} from local DB`);
          resolve(entry.data);
        };
        request.onerror = () => resolve(null);
      });
    } catch { return null; }
  }

  /**
   * Save user data to local DB for instant loading on next visit.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveUserData(category: string, userId: string, data: any): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      const key = `${userId}:${category}`;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(USER_DATA_STORE, 'readwrite');
        const store = tx.objectStore(USER_DATA_STORE);
        const entry: UserDataEntry = { key, data, timestamp: Date.now(), userId };
        store.put(entry);
        tx.oncomplete = () => { console.log(`[TorahDB] 💾 Saved user ${category}`); resolve(); };
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /**
   * Clear all user data from local DB.
   */
  async clearUserData(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(USER_DATA_STORE, 'readwrite');
        tx.objectStore(USER_DATA_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /**
   * Check if user data exists locally for a given category.
   * Checks if any entry with a key containing the category name exists.
   */
  async hasUserData(category: string): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) return false;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(USER_DATA_STORE, 'readonly');
        const store = tx.objectStore(USER_DATA_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
          const entries = (request.result as UserDataEntry[]) || [];
          resolve(entries.some(e => e.key.includes(category)));
        };
        request.onerror = () => resolve(false);
      });
    } catch { return false; }
  }

  // ==================== COMMENTARIES (Sefaria data) ====================

  /**
   * Get commentary data from local DB.
   * Key format: "Rashi-Genesis" (full book) or "Rashi-Genesis-1-1" (specific verse)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCommentary(key: string): Promise<any | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(COMMENTARY_STORE, 'readonly');
        const store = tx.objectStore(COMMENTARY_STORE);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result as CommentaryEntry | undefined;
          if (!entry) { resolve(null); return; }
          resolve(entry.data);
        };
        request.onerror = () => resolve(null);
      });
    } catch { return null; }
  }

  /**
   * Save commentary data to local DB.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveCommentary(key: string, data: any): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(COMMENTARY_STORE, 'readwrite');
        const store = tx.objectStore(COMMENTARY_STORE);
        const entry: CommentaryEntry = { key, data, timestamp: Date.now() };
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /**
   * Get count of stored commentaries.
   */
  async getCommentaryCount(): Promise<number> {
    try {
      await this.init();
      if (!this.db) return 0;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(COMMENTARY_STORE, 'readonly');
        const request = tx.objectStore(COMMENTARY_STORE).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch { return 0; }
  }

  /**
   * Clear all commentary data.
   */
  async clearCommentaries(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(COMMENTARY_STORE, 'readwrite');
        tx.objectStore(COMMENTARY_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  // ==================== GENERAL ====================

  /**
   * Clear ALL stored data (sefarim + user data + commentaries).
   */
  async clearAll(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const stores = [SEFER_STORE, USER_DATA_STORE, COMMENTARY_STORE, META_STORE];
      return new Promise((resolve) => {
        const tx = this.db!.transaction(stores, 'readwrite');
        stores.forEach(s => tx.objectStore(s).clear());
        tx.oncomplete = () => { console.log('[TorahDB] 🗑️ All local data cleared'); resolve(); };
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /**
   * Clear only sefarim data.
   */
  async clearSefarim(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(SEFER_STORE, 'readwrite');
        tx.objectStore(SEFER_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  async getTotalSize(): Promise<number> {
    const stored = await this.getStoredSefarim();
    return stored.reduce((sum, s) => sum + s.sizeMB, 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setMeta(key: string, value: any): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(META_STORE, 'readwrite');
        tx.objectStore(META_STORE).put({ key, value } as MetaEntry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMeta(key: string): Promise<any> {
    try {
      await this.init();
      if (!this.db) return null;
      return new Promise((resolve) => {
        const tx = this.db!.transaction(META_STORE, 'readonly');
        const request = tx.objectStore(META_STORE).get(key);
        request.onsuccess = () => resolve(request.result?.value ?? null);
        request.onerror = () => resolve(null);
      });
    } catch { return null; }
  }
}

// Singleton instance - initialized once, reused everywhere
export const torahDB = new TorahLocalDB();
