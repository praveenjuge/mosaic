"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
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
      className="bg-muted w-full border-[0.5px] p-0.5"
    >
      <ToggleGroupItem
        value="system"
        onClick={() => setTheme("system")}
        className="data-[state=on]:bg-background w-full gap-1 data-[state=on]:border-[0.5px]"
      >
        <Monitor className="size-4 stroke-2" />
        <span className="sr-only">System</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="light"
        onClick={() => setTheme("light")}
        className="data-[state=on]:bg-background w-full gap-1 data-[state=on]:border-[0.5px]"
      >
        <Sun className="size-4 stroke-2" />
        <span className="sr-only">Light</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        onClick={() => setTheme("dark")}
        className="data-[state=on]:bg-background w-full gap-1 data-[state=on]:border-[0.5px]"
      >
        <Moon className="size-4 stroke-2" />
        <span className="sr-only">Dark</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
