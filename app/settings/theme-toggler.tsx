"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Desktop, Moon, Sun } from "@mynaui/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const [defaultValue, setDefaultValue] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme) setDefaultValue(theme);
  }, [theme]);

  return (
    <ToggleGroup
      type="single"
      disabled={!defaultValue}
      value={defaultValue}
      className="rounded-full border-[0.5px] bg-muted p-0.5"
    >
      <ToggleGroupItem
        value="system"
        onClick={() => setTheme("system")}
        className="w-full gap-2 rounded-full data-[state=on]:border-[0.5px] data-[state=on]:bg-background"
      >
        <Desktop className="size-5" />
        System
      </ToggleGroupItem>
      <ToggleGroupItem
        value="light"
        onClick={() => setTheme("light")}
        className="w-full gap-2 rounded-full data-[state=on]:border-[0.5px] data-[state=on]:bg-background"
      >
        <Sun className="size-5" />
        Light
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        onClick={() => setTheme("dark")}
        className="w-full gap-2 rounded-full data-[state=on]:border-[0.5px] data-[state=on]:bg-background"
      >
        <Moon className="size-5" />
        Dark
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
