import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useAuth } from "@/contexts/AuthContext";

export type Theme = "classic" | "royal-gold" | "elegant-night" | "ancient-scroll" | "light" | "gold-silver";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();

  const { data: theme, setData: setThemeData, status } = useSyncedState<Theme>({
    localStorageKey: "torah-theme",
    tableName: "user_settings",
    column: "theme",
    userId,
    syncToCloud: !!userId,
    defaultValue: "classic",
  });

  useEffect(() => {
    document.documentElement.classList.remove("classic", "royal-gold", "elegant-night", "ancient-scroll", "light", "gold-silver");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeData(newTheme);
  };

  const value = useMemo(() => ({ theme, setTheme, syncStatus: status }), [theme, status]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
