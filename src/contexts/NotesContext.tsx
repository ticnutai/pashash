import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { torahDB } from "@/utils/torahDB";

export interface Note {
  id: string;
  pasukId: string;
  content: string;
  createdAt: number;
}

export interface PersonalQuestion {
  id: string;
  pasukId: string;
  question: string;
  answer?: string;
  createdAt: number;
}

interface NotesContextType {
  notes: Note[];
  questions: PersonalQuestion[];
  addNote: (pasukId: string, content: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  getNotesForPasuk: (pasukId: string) => Note[];
  addQuestion: (pasukId: string, question: string) => void;
  updateQuestion: (id: string, question: string, answer?: string) => void;
  deleteQuestion: (id: string) => void;
  getQuestionsForPasuk: (pasukId: string) => PersonalQuestion[];
  loading: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [questions, setQuestions] = useState<PersonalQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes: local DB first (instant), then sync with Supabase
  useEffect(() => {
    if (user) {
      loadWithCache();
    } else {
      setNotes([]);
      setQuestions([]);
      setLoading(false);
    }
  }, [user]);

  // Auto-save to cache whenever data changes
  useEffect(() => {
    if (user && !loading) {
      saveNotesToCache(notes, questions);
    }
  }, [notes, questions]);

  const saveNotesToCache = (n: Note[], q: PersonalQuestion[]) => {
    if (!user) return;
    torahDB.saveUserData('notes', user.id, n).catch(() => {});
    torahDB.saveUserData('personal_questions', user.id, q).catch(() => {});
  };

  const loadWithCache = async () => {
    if (!user) return;
    setLoading(true);

    // FAST PATH: Load from local DB
    try {
      const [cachedNotes, cachedQuestions] = await Promise.all([
        torahDB.getUserData('notes', user.id),
        torahDB.getUserData('personal_questions', user.id),
      ]);
      if (cachedNotes && Array.isArray(cachedNotes)) setNotes(cachedNotes);
      if (cachedQuestions && Array.isArray(cachedQuestions)) setQuestions(cachedQuestions);
      setLoading(false);
    } catch { /* ignore */ }

    // BACKGROUND: Sync with cloud
    await loadNotesAndQuestions();
  };

  const loadNotesAndQuestions = async () => {
    if (!user) return;

    try {
      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;

      const mappedNotes: Note[] = (notesData || []).map((note) => ({
        id: note.id,
        pasukId: note.pasuk_id,
        content: note.note_text,
        createdAt: new Date(note.created_at).getTime(),
      }));

      setNotes(mappedNotes);

      // Load personal questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("user_personal_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;

      const mappedQuestions: PersonalQuestion[] = (questionsData || []).map((q) => ({
        id: q.id,
        pasukId: q.pasuk_id,
        question: q.question_text,
        answer: q.answer_text || undefined,
        createdAt: new Date(q.created_at).getTime(),
      }));

      setQuestions(mappedQuestions);
      saveNotesToCache(mappedNotes, mappedQuestions);
    } catch (error: any) {
      console.error("Error loading notes and questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (pasukId: string, content: string) => {
    if (!user) {
      toast.error("יש להתחבר כדי להוסיף הערה");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_notes")
        .insert({
          user_id: user.id,
          pasuk_id: pasukId,
          note_text: content,
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        pasukId: data.pasuk_id,
        content: data.note_text,
        createdAt: new Date(data.created_at).getTime(),
      };

      setNotes((prev) => [newNote, ...prev]);
      toast.success("ההערה נוספה בהצלחה");
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("שגיאה בהוספת הערה");
    }
  };

  const updateNote = async (id: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_notes")
        .update({ note_text: content })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, content } : note))
      );
      toast.success("ההערה עודכנה");
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast.error("שגיאה בעדכון הערה");
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotes((prev) => prev.filter((note) => note.id !== id));
      toast.success("ההערה נמחקה");
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast.error("שגיאה במחיקת הערה");
    }
  };

  const getNotesForPasuk = useCallback((pasukId: string) => {
    return notes.filter((note) => note.pasukId === pasukId);
  }, [notes]);

  const addQuestion = async (pasukId: string, question: string) => {
    if (!user) {
      toast.error("יש להתחבר כדי להוסיף שאלה");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_personal_questions")
        .insert({
          user_id: user.id,
          pasuk_id: pasukId,
          question_text: question,
        })
        .select()
        .single();

      if (error) throw error;

      const newQuestion: PersonalQuestion = {
        id: data.id,
        pasukId: data.pasuk_id,
        question: data.question_text,
        answer: data.answer_text || undefined,
        createdAt: new Date(data.created_at).getTime(),
      };

      setQuestions((prev) => [newQuestion, ...prev]);
      toast.success("השאלה נוספה בהצלחה");
    } catch (error: any) {
      console.error("Error adding question:", error);
      toast.error("שגיאה בהוספת שאלה");
    }
  };

  const updateQuestion = async (id: string, question: string, answer?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_personal_questions")
        .update({
          question_text: question,
          answer_text: answer || null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, question, answer } : q))
      );
      toast.success("השאלה עודכנה");
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast.error("שגיאה בעדכון שאלה");
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_personal_questions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("השאלה נמחקה");
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast.error("שגיאה במחיקת שאלה");
    }
  };

  const getQuestionsForPasuk = useCallback((pasukId: string) => {
    return questions.filter((q) => q.pasukId === pasukId);
  }, [questions]);

  const value = useMemo(() => ({
    notes, questions,
    addNote, updateNote, deleteNote, getNotesForPasuk,
    addQuestion, updateQuestion, deleteQuestion, getQuestionsForPasuk,
    loading,
  }), [notes, questions, loading, getNotesForPasuk, getQuestionsForPasuk]);

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within NotesProvider");
  }
  return context;
};
