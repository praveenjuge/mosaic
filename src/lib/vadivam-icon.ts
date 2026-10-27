import { createElement, forwardRef } from "react";
import type { IconNode, VadivamIcon, VadivamProps } from "vadivam-react";

/**
 * A lighter `createIcon` for Vadivam's icon modules, swapped in at build time
 * by `vite.config.ts`. Vadivam's own renderer sanitizes every icon's nodes
 * and props at runtime, which costs about 6 KB of client JavaScript; Mosaic
 * only renders the package's own static icon data, so it renders the same
 * `<svg>` directly. Mosaic doesn't use `VadivamProvider`, so there's no
 * context to read.
 */
export function createIcon(iconName: string, iconNode: IconNode): VadivamIcon {
  const Icon = forwardRef<SVGSVGElement, VadivamProps>(
    (
      {
        className,
        size = 24,
        color = "currentColor",
        strokeWidth = 2,
        absoluteStrokeWidth,
        title,
        children,
        ...rest
      },
      ref,
    ) => {
      const labelled =
        Boolean(title) ||
        Object.keys(rest).some(
          (name) =>
            name.startsWith("aria-") || name === "role" || name === "title",
        );
      return createElement(
        "svg",
        {
          ref,
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          strokeWidth:
            absoluteStrokeWidth && Number(size)
              ? (Number(strokeWidth) * 24) / Number(size)
              : strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: ["vadivam", `vadivam-${iconName}`, className]
            .filter(Boolean)
            .join(" "),
          ...(labelled ? {} : { "aria-hidden": "true" }),
          ...(title ? { role: "img" } : {}),
          ...rest,
        },
        title ? createElement("title", { key: "title" }, title) : null,
        ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        children,
      );
    },
  );
  return Icon;
}
