import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useAuth } from "@/contexts/AuthContext";

export type DisplayMode = "full" | "verses-only" | "verses-questions" | "minimized" | "compact" | "scroll" | "chumash";

export interface DisplaySettings {
  mode: DisplayMode;
  pasukCount: number;
  loadMoreCount: number;
}

interface DisplayModeContextType {
  displaySettings: DisplaySettings;
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

const defaultSettings: DisplaySettings = {
  mode: "scroll",
  pasukCount: 10,
  loadMoreCount: 10,
};

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

export const DisplayModeProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();

  const { data: displaySettings, setData: setDisplaySettingsData, status } = useSyncedState<DisplaySettings>({
    localStorageKey: "torah-display-settings",
    tableName: "user_settings",
    column: "display_settings",
    userId,
    syncToCloud: !!userId,
    defaultValue: defaultSettings,
  });

  const updateDisplaySettings = (settings: Partial<DisplaySettings>) => {
    setDisplaySettingsData((prev) => ({ ...prev, ...settings }));
  };

  // Safety layer: ensure displaySettings always has valid structure
  const safeDisplaySettings: DisplaySettings = {
    mode: displaySettings?.mode || defaultSettings.mode,
    pasukCount: displaySettings?.pasukCount || defaultSettings.pasukCount,
    loadMoreCount: displaySettings?.loadMoreCount || defaultSettings.loadMoreCount,
  };

  const value = useMemo(() => ({
    displaySettings: safeDisplaySettings,
    updateDisplaySettings,
    syncStatus: status,
  }), [safeDisplaySettings.mode, safeDisplaySettings.pasukCount, safeDisplaySettings.loadMoreCount, status]);

  return (
    <DisplayModeContext.Provider value={value}>
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = () => {
  const context = useContext(DisplayModeContext);
  if (!context) {
    throw new Error("useDisplayMode must be used within DisplayModeProvider");
  }
  return context;
};
