import { AlignRight, AlignCenter, AlignLeft, Space, Palette, AlignJustify, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useFontAndColorSettings } from "@/contexts/FontAndColorSettingsContext";

export const TextDisplaySettings = () => {
  const { settings, updateSettings } = useFontAndColorSettings();

  const alignments = [
    { value: "right", label: "ימין", icon: AlignRight },
    { value: "center", label: "מרכז", icon: AlignCenter },
    { value: "left", label: "שמאל", icon: AlignLeft },
  ];

  const spacings = [
    { value: "compact", label: "צפוף", description: "מרווח קטן" },
    { value: "normal", label: "רגיל", description: "מרווח סטנדרטי" },
    { value: "comfortable", label: "נוח", description: "מרווח בינוני" },
    { value: "spacious", label: "מרווח", description: "מרווח גדול" },
    { value: "custom", label: "מותאם אישית", description: "הגדר ערך" },
  ];

  const lineHeights = [
    { value: "tight", label: "צמוד", description: "1.3" },
    { value: "normal", label: "רגיל", description: "1.5" },
    { value: "relaxed", label: "רגוע", description: "1.7" },
    { value: "loose", label: "רפוי", description: "2.0" },
    { value: "custom", label: "מותאם אישית", description: "הגדר ערך" },
  ];

  const widths = [
    { value: "narrow", label: "צר", description: "600px" },
    { value: "normal", label: "רגיל", description: "800px" },
    { value: "wide", label: "רחב", description: "1000px" },
    { value: "full", label: "מלא", description: "100%" },
  ];

  const letterSpacings = [
    { value: "tight", label: "צמוד", description: "-0.02em" },
    { value: "normal", label: "רגיל", description: "0em" },
    { value: "wide", label: "רחב", description: "0.05em" },
    { value: "wider", label: "רחב יותר", description: "0.1em" },
    { value: "custom", label: "מותאם אישית", description: "הגדר ערך" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:text-white hover:bg-white/10"
          title="הגדרות תצוגת טקסט"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-right">תצוגת טקסט</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Text Alignment */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-right">
            <AlignRight className="ml-2 h-4 w-4" />
            יישור טקסט
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {alignments.map((align) => {
              const Icon = align.icon;
              return (
                <DropdownMenuItem
                  key={align.value}
                  onClick={() => updateSettings({ textAlignment: align.value as any })}
                  className={`text-right ${
                    settings.textAlignment === align.value ? "bg-accent" : ""
                  }`}
                >
                  <Icon className="ml-2 h-4 w-4" />
                  {align.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Content Spacing */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-right">
            <Space className="ml-2 h-4 w-4" />
            מרווח תוכן
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {spacings.map((spacing) => (
              <DropdownMenuItem
                key={spacing.value}
                onClick={() => updateSettings({ contentSpacing: spacing.value as any })}
                className={`text-right ${
                  settings.contentSpacing === spacing.value ? "bg-accent" : ""
                }`}
              >
                <div className="flex-1 text-right">
                  <div className="font-semibold">{spacing.label}</div>
                  <div className="text-xs text-muted-foreground">{spacing.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
            {settings.contentSpacing === "custom" && (
              <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="5"
                  value={settings.contentSpacingCustom || 1}
                  onChange={(e) => updateSettings({ contentSpacingCustom: parseFloat(e.target.value) || 1 })}
                  className="h-8 text-right"
                  placeholder="rem"
                />
                <div className="text-xs text-muted-foreground text-right mt-1">ערך ב-rem</div>
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Line Height */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-right">
            <AlignJustify className="ml-2 h-4 w-4" />
            גובה שורה
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {lineHeights.map((lineHeight) => (
              <DropdownMenuItem
                key={lineHeight.value}
                onClick={() => updateSettings({ lineHeight: lineHeight.value as any })}
                className={`text-right ${
                  settings.lineHeight === lineHeight.value ? "bg-accent" : ""
                }`}
              >
                <div className="flex-1 text-right">
                  <div className="font-semibold">{lineHeight.label}</div>
                  <div className="text-xs text-muted-foreground">{lineHeight.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
            {settings.lineHeight === "custom" && (
              <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={settings.lineHeightCustom || 1.5}
                  onChange={(e) => updateSettings({ lineHeightCustom: parseFloat(e.target.value) || 1.5 })}
                  className="h-8 text-right"
                  placeholder="1.5"
                />
                <div className="text-xs text-muted-foreground text-right mt-1">ערך מספרי (1-3)</div>
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Content Width */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-right">
            <AlignCenter className="ml-2 h-4 w-4" />
            רוחב תוכן
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {widths.map((width) => (
              <DropdownMenuItem
                key={width.value}
                onClick={() => updateSettings({ contentWidth: width.value as any })}
                className={`text-right ${
                  settings.contentWidth === width.value ? "bg-accent" : ""
                }`}
              >
                <div className="flex-1 text-right">
                  <div className="font-semibold">{width.label}</div>
                  <div className="text-xs text-muted-foreground">{width.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Letter Spacing */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-right">
            <Type className="ml-2 h-4 w-4" />
            מרווח בין אותיות
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {letterSpacings.map((spacing) => (
              <DropdownMenuItem
                key={spacing.value}
                onClick={() => updateSettings({ letterSpacing: spacing.value as any })}
                className={`text-right ${
                  settings.letterSpacing === spacing.value ? "bg-accent" : ""
                }`}
              >
                <div className="flex-1 text-right">
                  <div className="font-semibold">{spacing.label}</div>
                  <div className="text-xs text-muted-foreground">{spacing.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
            {settings.letterSpacing === "custom" && (
              <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  step="0.01"
                  min="-0.1"
                  max="0.5"
                  value={settings.letterSpacingCustom || 0}
                  onChange={(e) => updateSettings({ letterSpacingCustom: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-right"
                  placeholder="em"
                />
                <div className="text-xs text-muted-foreground text-right mt-1">ערך ב-em</div>
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
