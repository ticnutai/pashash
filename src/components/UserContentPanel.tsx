import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bookmark, 
  StickyNote, 
  Highlighter, 
  HelpCircle, 
  X,
  ExternalLink,
  Trash2,
  ChevronDown
} from "lucide-react";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useNotes } from "@/contexts/NotesContext";
import { useHighlights } from "@/contexts/HighlightsContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { parsePasukId } from "@/utils/names";

interface UserContentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserContentPanel = ({ isOpen, onClose }: UserContentPanelProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, removeBookmark } = useBookmarks();
  const { notes, questions, deleteNote, deleteQuestion } = useNotes();
  const { highlights, removeHighlight } = useHighlights();

  const [expandedSections, setExpandedSections] = useState({
    bookmarks: true,
    notes: true,
    questions: true,
    highlights: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigateToPasuk = (pasukId: string) => {
    const parsed = parsePasukId(pasukId);
    if (parsed) {
      navigate(`/?sefer=${parsed.sefer}&perek=${parsed.perek}&pasuk=${parsed.pasuk}`);
    }
  };

  const formatPasukLocation = (pasukId: string) => {
    const parsed = parsePasukId(pasukId);
    if (parsed) {
      return `פרק ${parsed.perek} פסוק ${parsed.pasuk}`;
    }
    return pasukId;
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed left-0 top-[140px] md:top-[160px] w-72 h-[calc(100vh-160px)] bg-background border-r border-border shadow-lg z-40 animate-slide-in-left">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">התוכן שלי</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-[calc(100%-60px)] p-4 text-center">
          <p className="text-muted-foreground mb-4">יש להתחבר כדי לצפות בתוכן שלך</p>
          <Button onClick={() => navigate("/auth")}>התחברות</Button>
        </div>
      </div>
    );
  }

  const totalItems = bookmarks.length + notes.length + questions.length + highlights.length;

  return (
    <div className="fixed left-0 top-[140px] md:top-[160px] w-72 md:w-80 h-[calc(100vh-160px)] bg-background border-r border-border shadow-lg z-40 animate-slide-in-left">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">התוכן שלי ({totalItems})</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-3 space-y-3">
          {/* Bookmarks Section */}
          <Collapsible open={expandedSections.bookmarks} onOpenChange={() => toggleSection('bookmarks')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" />
                    <span className="font-medium">סימניות</span>
                    <span className="text-xs text-muted-foreground">({bookmarks.length})</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.bookmarks && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">אין סימניות</p>
                  ) : (
                    bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{formatPasukLocation(bookmark.pasukId)}</p>
                          <p className="truncate" dir="rtl">{bookmark.pasukText.slice(0, 50)}...</p>
                          {bookmark.note && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{bookmark.note}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigateToPasuk(bookmark.pasukId)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeBookmark(bookmark.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Notes Section */}
          <Collapsible open={expandedSections.notes} onOpenChange={() => toggleSection('notes')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">הערות</span>
                    <span className="text-xs text-muted-foreground">({notes.length})</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.notes && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">אין הערות</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{formatPasukLocation(note.pasukId)}</p>
                          <p className="truncate" dir="rtl">{note.content}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigateToPasuk(note.pasukId)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Questions Section */}
          <Collapsible open={expandedSections.questions} onOpenChange={() => toggleSection('questions')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">שאלות</span>
                    <span className="text-xs text-muted-foreground">({questions.length})</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.questions && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">אין שאלות</p>
                  ) : (
                    questions.map((question) => (
                      <div key={question.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{formatPasukLocation(question.pasukId)}</p>
                          <p className="truncate" dir="rtl">{question.question}</p>
                          {question.answer && (
                            <p className="text-xs text-green-600 mt-1 truncate">תשובה: {question.answer}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigateToPasuk(question.pasukId)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteQuestion(question.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Highlights Section */}
          <Collapsible open={expandedSections.highlights} onOpenChange={() => toggleSection('highlights')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Highlighter className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">הדגשות</span>
                    <span className="text-xs text-muted-foreground">({highlights.length})</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.highlights && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                  {highlights.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">אין הדגשות</p>
                  ) : (
                    highlights.map((highlight) => (
                      <div key={highlight.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{formatPasukLocation(highlight.pasukId)}</p>
                          <p className={cn("truncate rounded px-1", highlight.color)} dir="rtl">
                            {highlight.text}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigateToPasuk(highlight.pasukId)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeHighlight(highlight.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};
