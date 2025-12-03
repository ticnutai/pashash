import { AlignRight, AlignCenter, AlignLeft, Space, Palette, AlignJustify, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
          variant="outline"
          size="sm"
          className="gap-2"
          title="הגדרות תצוגת טקסט"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">עיצוב טקסט</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
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
          <DropdownMenuSubContent className="w-56">
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
              <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{(settings.contentSpacingCustom || 1).toFixed(2)} rem</span>
                </div>
                <Slider
                  value={[settings.contentSpacingCustom || 1]}
                  onValueChange={([value]) => updateSettings({ contentSpacingCustom: value })}
                  min={0}
                  max={5}
                  step={0.25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5</span>
                  <span>0</span>
                </div>
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
          <DropdownMenuSubContent className="w-56">
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
              <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{(settings.lineHeightCustom || 1.5).toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.lineHeightCustom || 1.5]}
                  onValueChange={([value]) => updateSettings({ lineHeightCustom: value })}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>3</span>
                  <span>1</span>
                </div>
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
          <DropdownMenuSubContent className="w-56">
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
              <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{(settings.letterSpacingCustom || 0).toFixed(2)} em</span>
                </div>
                <Slider
                  value={[settings.letterSpacingCustom || 0]}
                  onValueChange={([value]) => updateSettings({ letterSpacingCustom: value })}
                  min={-0.1}
                  max={0.5}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.5</span>
                  <span>-0.1</span>
                </div>
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
