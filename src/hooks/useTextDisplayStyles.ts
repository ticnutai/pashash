import { useFontAndColorSettings } from "@/contexts/FontAndColorSettingsContext";
import { useDevice } from "@/contexts/DeviceContext";

export const useTextDisplayStyles = () => {
  const { settings } = useFontAndColorSettings();
  const { isMobile } = useDevice();

  // Get font scale (default 1)
  const fontScale = settings.fontScale || 1;

  // Spacing values - responsive
  const getSpacing = () => {
    if (settings.contentSpacing === "custom") {
      return `${settings.contentSpacingCustom || 1}rem`;
    }
    const spacingMap = {
      compact: isMobile ? "0.25rem" : "0.5rem",
      normal: isMobile ? "0.5rem" : "1rem",
      comfortable: isMobile ? "0.75rem" : "1.5rem",
      spacious: isMobile ? "1rem" : "2rem",
    };
    return spacingMap[settings.contentSpacing] || spacingMap.normal;
  };

  // Line height values
  const getLineHeight = () => {
    if (settings.lineHeight === "custom") {
      return String(settings.lineHeightCustom || 1.5);
    }
    const lineHeightMap = {
      tight: "1.3",
      normal: "1.5",
      relaxed: "1.7",
      loose: "2.0",
    };
    return lineHeightMap[settings.lineHeight] || lineHeightMap.normal;
  };

  // Letter spacing values
  const getLetterSpacing = () => {
    if (settings.letterSpacing === "custom") {
      return `${settings.letterSpacingCustom || 0}em`;
    }
    const letterSpacingMap = {
      tight: "-0.02em",
      normal: "0em",
      wide: "0.05em",
      wider: "0.1em",
    };
    return letterSpacingMap[settings.letterSpacing] || letterSpacingMap.normal;
  };

  // Content width values - responsive with max constraints
  const getMaxWidth = () => {
    if (isMobile) return "100%";
    
    switch (settings.contentWidth) {
      case "narrow": return "min(600px, 95vw)";
      case "normal": return "min(800px, 95vw)";
      case "wide": return "min(1000px, 95vw)";
      case "full": return "100%";
      default: return "min(800px, 95vw)";
    }
  };

  // Alignment values
  const alignmentMap = {
    right: "right",
    center: "center",
    left: "left",
  };

  // Padding for mobile
  const padding = isMobile ? "0.5rem" : "1rem";

  return {
    textAlign: alignmentMap[settings.textAlignment] as "right" | "center" | "left",
    gap: getSpacing(),
    lineHeight: getLineHeight(),
    letterSpacing: getLetterSpacing(),
    maxWidth: getMaxWidth(),
    margin: settings.textAlignment === "center" ? "0 auto" : "0",
    padding,
    fontScale,
    isMobile,
  };
};
