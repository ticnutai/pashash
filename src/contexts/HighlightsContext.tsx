import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { torahDB } from "@/utils/torahDB";

export interface Highlight {
  pasukId: string;
  text: string;
  color: string;
  startIndex: number;
  endIndex: number;
  id: string;
}

interface HighlightsContextType {
  highlights: Highlight[];
  addHighlight: (highlight: Omit<Highlight, "id">) => void;
  removeHighlight: (id: string) => void;
  getHighlightsForPasuk: (pasukId: string) => Highlight[];
  loading: boolean;
}

const HighlightsContext = createContext<HighlightsContextType | undefined>(undefined);

export const HighlightsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Load highlights: local DB first (instant), then sync with Supabase
  useEffect(() => {
    if (user) {
      loadHighlightsWithCache();
    } else {
      setHighlights([]);
      setLoading(false);
    }
  }, [user]);

  const loadHighlightsWithCache = async () => {
    if (!user) return;
    setLoading(true);

    // FAST PATH: Load from local DB
    try {
      const cached = await torahDB.getUserData('highlights', user.id);
      if (cached && Array.isArray(cached)) {
        setHighlights(cached);
        setLoading(false); // Show cached data immediately
      }
    } catch { /* ignore cache errors */ }

    // BACKGROUND: Sync with Supabase
    await loadHighlightsFromCloud();
  };

  const saveHighlightsToCache = (data: Highlight[]) => {
    if (!user) return;
    torahDB.saveUserData('highlights', user.id, data).catch(() => {});
  };

  const loadHighlightsFromCloud = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_highlights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedHighlights: Highlight[] = (data || []).map((h) => ({
        id: h.id,
        pasukId: h.pasuk_id,
        text: h.highlight_text,
        color: h.color,
        startIndex: h.start_index,
        endIndex: h.end_index,
      }));

      setHighlights(mappedHighlights);
      saveHighlightsToCache(mappedHighlights);
    } catch (error: any) {
      console.error("Error loading highlights:", error);
    } finally {
      setLoading(false);
    }
  };

  const addHighlight = async (highlight: Omit<Highlight, "id">) => {
    if (!user) {
      toast.error("יש להתחבר כדי להוסיף הדגשה");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_highlights")
        .insert({
          user_id: user.id,
          pasuk_id: highlight.pasukId,
          highlight_text: highlight.text,
          color: highlight.color,
          start_index: highlight.startIndex,
          end_index: highlight.endIndex,
        })
        .select()
        .single();

      if (error) throw error;

      const newHighlight: Highlight = {
        id: data.id,
        pasukId: data.pasuk_id,
        text: data.highlight_text,
        color: data.color,
        startIndex: data.start_index,
        endIndex: data.end_index,
      };

      setHighlights((prev) => {
        const updated = [newHighlight, ...prev];
        saveHighlightsToCache(updated);
        return updated;
      });
      toast.success("ההדגשה נוספה בהצלחה");
    } catch (error: any) {
      console.error("Error adding highlight:", error);
      toast.error("שגיאה בהוספת הדגשה");
    }
  };

  const removeHighlight = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_highlights")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setHighlights((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        saveHighlightsToCache(updated);
        return updated;
      });
      toast.success("ההדגשה נמחקה");
    } catch (error: any) {
      console.error("Error deleting highlight:", error);
      toast.error("שגיאה במחיקת הדגשה");
    }
  };

  const getHighlightsForPasuk = useCallback((pasukId: string) => {
    return highlights.filter((h) => h.pasukId === pasukId);
  }, [highlights]);

  const value = useMemo(() => ({
    highlights, addHighlight, removeHighlight, getHighlightsForPasuk, loading
  }), [highlights, loading, getHighlightsForPasuk]);

  return (
    <HighlightsContext.Provider value={value}>
      {children}
    </HighlightsContext.Provider>
  );
};

export const useHighlights = () => {
  const context = useContext(HighlightsContext);
  if (!context) {
    throw new Error("useHighlights must be used within HighlightsProvider");
  }
  return context;
};
