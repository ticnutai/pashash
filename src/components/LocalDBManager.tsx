import { useState, useEffect, useCallback } from "react";
import { Download, Trash2, HardDrive, CheckCircle2, Loader2, Database, BookOpen, MessageSquare, Bookmark, Palette, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { torahDB } from "@/utils/torahDB";
import { downloadAllSefarim, clearAllSeferCache } from "@/utils/lazyLoadSefer";

const SEFER_NAMES = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];

interface StoredInfo {
  seferId: number;
  timestamp: number;
  sizeMB: number;
}

interface DataStatus {
  sefarim: StoredInfo[];
  userDataKeys: string[];
  commentaryCount: number;
  totalSizeMB: number;
}

export const LocalDBManager = () => {
  const [status, setStatus] = useState<DataStatus>({
    sefarim: [],
    userDataKeys: [],
    commentaryCount: 0,
    totalSizeMB: 0,
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 5, current: '' });
  const [open, setOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    const [sefarim, totalSizeMB, commentaryCount] = await Promise.all([
      torahDB.getStoredSefarim(),
      torahDB.getTotalSize(),
      torahDB.getCommentaryCount(),
    ]);

    // Check which user data keys exist
    const userDataKeys: string[] = [];
    for (const key of ['highlights', 'notes', 'personal_questions', 'bookmarks', 'content']) {
      const hasData = await torahDB.hasUserData(key);
      if (hasData) userDataKeys.push(key);
    }

    setStatus({
      sefarim,
      userDataKeys,
      commentaryCount,
      totalSizeMB: Math.round(totalSizeMB * 10) / 10,
    });
  }, []);

  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open, loadStatus]);

  const handleDownloadAll = async () => {
    setDownloading(true);
    setDownloadProgress({ completed: 0, total: 5, current: SEFER_NAMES[0] });
    
    try {
      await downloadAllSefarim((completed, total, currentName) => {
        setDownloadProgress({ completed, total, current: currentName });
      });
      
      toast.success("כל החומשים נשמרו בהצלחה! הטעינה תהיה מהירה מעכשיו");
      await loadStatus();
    } catch (error) {
      console.error('Download error:', error);
      toast.error("שגיאה בהורדת הנתונים");
    } finally {
      setDownloading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await torahDB.clearAll();
      clearAllSeferCache();
      toast.success("כל הנתונים המקומיים נמחקו");
      await loadStatus();
    } catch (error) {
      toast.error("שגיאה במחיקת הנתונים");
    }
  };

  const handleClearSefarim = async () => {
    try {
      await clearAllSeferCache();
      toast.success("חומשים מקומיים נמחקו");
      await loadStatus();
    } catch (error) {
      toast.error("שגיאה במחיקה");
    }
  };

  const handleClearUserData = async () => {
    try {
      await torahDB.clearUserData();
      toast.success("נתוני משתמש מקומיים נמחקו");
      await loadStatus();
    } catch (error) {
      toast.error("שגיאה במחיקה");
    }
  };

  const handleClearCommentaries = async () => {
    try {
      await torahDB.clearCommentaries();
      toast.success("מפרשים מקומיים נמחקו");
      await loadStatus();
    } catch (error) {
      toast.error("שגיאה במחיקה");
    }
  };

  const isStored = (seferId: number) => status.sefarim.some(s => s.seferId === seferId);
  const allStored = status.sefarim.length === 5;
  const progressPercent = (downloadProgress.completed / downloadProgress.total) * 100;

  const USER_DATA_LABELS: Record<string, { label: string; icon: typeof Bookmark }> = {
    highlights: { label: 'הדגשות', icon: Palette },
    notes: { label: 'הערות', icon: MessageSquare },
    personal_questions: { label: 'שאלות אישיות', icon: MessageSquare },
    bookmarks: { label: 'סימניות', icon: Bookmark },
    content: { label: 'תכנים', icon: FileText },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">אחסון מקומי</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl flex items-center gap-2 justify-end">
            <span>אחסון מקומי להאצת טעינה</span>
            <HardDrive className="h-5 w-5" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground text-right leading-relaxed">
            כל הנתונים נשמרים מקומית למכשיר שלך.
            בפעם הבאה הכל יטען <strong>מיד</strong> בלי לחכות לענן.
          </p>

          {/* === SEFARIM SECTION === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleClearSefarim} disabled={status.sefarim.length === 0 || downloading}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                חומשים
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SEFER_NAMES.map((name, index) => {
                const seferId = index + 1;
                const stored = isStored(seferId);
                return (
                  <div
                    key={seferId}
                    className={`text-center p-2 rounded-lg text-xs ${
                      stored ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {stored && <CheckCircle2 className="h-3 w-3 mx-auto mb-0.5" />}
                    {name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* === USER DATA SECTION === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleClearUserData} disabled={status.userDataKeys.length === 0}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                נתוני משתמש
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(USER_DATA_LABELS).map(([key, { label, icon: Icon }]) => {
                const cached = status.userDataKeys.includes(key);
                return (
                  <div
                    key={key}
                    className={`text-center p-2 rounded-lg text-xs ${
                      cached ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-3 w-3 mx-auto mb-0.5" />
                    {label}
                    {cached && <span className="block text-[10px]">✓</span>}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground text-right">
              נתוני משתמש נשמרים אוטומטית בעת שימוש באתר
            </p>
          </div>

          {/* === COMMENTARIES SECTION === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleClearCommentaries} disabled={status.commentaryCount === 0}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                מפרשים ({status.commentaryCount} שמורים)
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground text-right">
              פירושים מ-Sefaria נשמרים אוטומטית כשצופים בהם
            </p>
          </div>

          {/* Total size */}
          {status.totalSizeMB > 0 && (
            <div className="text-xs text-muted-foreground text-right border-t pt-2">
              סה״כ: {status.totalSizeMB} MB מאוחסנים במכשיר
            </div>
          )}

          {/* Download progress */}
          {downloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{downloadProgress.completed}/{downloadProgress.total}</span>
                <span>מוריד: {downloadProgress.current}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDownloadAll}
              disabled={downloading || allStored}
              className="flex-1 gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מוריד...
                </>
              ) : allStored ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  כל החומשים מאוחסנים
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  הורד חומשים למכשיר
                </>
              )}
            </Button>
            
            {(status.sefarim.length > 0 || status.userDataKeys.length > 0 || status.commentaryCount > 0) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={downloading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                מחק הכל
              </Button>
            )}
          </div>

          {allStored && status.userDataKeys.length > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 text-right">
              ✓ כל הנתונים מאוחסנים מקומית. הטעינה תהיה מיידית!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
