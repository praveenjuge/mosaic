import { dark } from "@clerk/ui/themes";
import { useTheme } from "next-themes";

/** Clerk's components in Mosaic's colors, following the app's theme. */
export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    theme: isDark ? dark : undefined,
    variables: {
      colorPrimary: isDark ? "#f4f4f5" : "#18181b",
      colorPrimaryForeground: isDark ? "#18181b" : "#fafafa",
      borderRadius: "0.625rem",
      fontFamily: "inherit",
    },
  };
}
