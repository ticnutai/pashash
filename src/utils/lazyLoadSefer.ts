import { Sefer } from "@/types/torah";
import { torahDB } from "@/utils/torahDB";

// In-memory cache survives within the same session (no re-parsing needed)
const memoryCache = new Map<number, Sefer>();

/**
 * Load sefer data with 3-tier caching strategy:
 * 1. Memory cache (instant, ~0ms) - same session
 * 2. IndexedDB local DB (fast, ~20-50ms) - across sessions  
 * 3. Dynamic import from bundle (slow, ~200-2000ms) - first ever load
 * 
 * After loading from bundle, data is automatically saved to IndexedDB
 * so subsequent visits are near-instant.
 */
export const lazyLoadSefer = async (seferId: number): Promise<Sefer> => {
  const startTime = performance.now();

  // TIER 1: Memory cache (instant)
  if (memoryCache.has(seferId)) {
    console.log(`[LazyLoad] ⚡ Sefer ${seferId} from memory (${(performance.now() - startTime).toFixed(0)}ms)`);
    return memoryCache.get(seferId)!;
  }

  // TIER 2: IndexedDB local cache (fast)
  try {
    const cached = await torahDB.getSefer(seferId);
    if (cached) {
      memoryCache.set(seferId, cached);
      console.log(`[LazyLoad] 💾 Sefer ${seferId} from local DB (${(performance.now() - startTime).toFixed(0)}ms)`);
      return cached;
    }
  } catch (e) {
    console.warn('[LazyLoad] IndexedDB read failed, falling back to import:', e);
  }

  // TIER 3: Dynamic import from bundle (first load)
  console.log(`[LazyLoad] 📚 Loading sefer ${seferId} from bundle...`);
  
  let module;
  switch (seferId) {
    case 1:
      module = await import("@/data/bereishit.json");
      break;
    case 2:
      module = await import("@/data/shemot.json");
      break;
    case 3:
      module = await import("@/data/vayikra.json");
      break;
    case 4:
      module = await import("@/data/bamidbar.json");
      break;
    case 5:
      module = await import("@/data/devarim.json");
      break;
    default:
      throw new Error(`Unknown sefer ID: ${seferId}`);
  }
  
  const sefer = module.default as Sefer;
  
  // Cache in memory
  memoryCache.set(seferId, sefer);
  
  // Save to IndexedDB in background (don't await - don't block UI)
  torahDB.saveSefer(seferId, sefer).catch(e => {
    console.warn('[LazyLoad] Failed to save to local DB:', e);
  });
  
  console.log(`[LazyLoad] ✅ Sefer ${seferId} loaded from bundle (${(performance.now() - startTime).toFixed(0)}ms)`);
  return sefer;
};

/**
 * Preload next sefer in background for smooth navigation.
 * Uses requestIdleCallback when available for truly non-blocking preload.
 */
export const preloadNextSefer = (currentSeferId: number) => {
  const nextSeferId = currentSeferId < 5 ? currentSeferId + 1 : 1;
  
  const doPreload = () => {
    console.log(`[LazyLoad] 🔄 Preloading sefer ${nextSeferId}`);
    lazyLoadSefer(nextSeferId).catch(() => {
      // Silently fail - it's just a preload
    });
  };

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(doPreload, { timeout: 5000 });
  } else {
    setTimeout(doPreload, 2000);
  }
};

/**
 * Preload ALL 5 sefarim into local DB for offline/instant access.
 * Reports progress via callback. Call this from a "Download All" button.
 */
export const downloadAllSefarim = async (
  onProgress?: (completed: number, total: number, currentName: string) => void
): Promise<void> => {
  const names = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];
  
  for (let i = 1; i <= 5; i++) {
    onProgress?.(i - 1, 5, names[i - 1]);
    await lazyLoadSefer(i);
    onProgress?.(i, 5, names[i - 1]);
  }
};

/**
 * Get the memory cache for external use (e.g., Index.tsx seferCache).
 */
export const getSeferFromMemory = (seferId: number): Sefer | undefined => {
  return memoryCache.get(seferId);
};

/**
 * Clear all caches (memory + local DB).
 */
export const clearAllSeferCache = async (): Promise<void> => {
  memoryCache.clear();
  await torahDB.clearAll();
};
