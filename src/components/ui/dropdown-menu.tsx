import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * shadcn's DropdownMenu API, the parts Mosaic uses, on the native popover:
 * the browser handles light dismiss, Escape, and returning focus, so none of
 * Radix's menu, popper, or floating-ui code ships. Arrow keys move between
 * items; scrolling or resizing closes the menu.
 */

type DropdownMenuContextValue = {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu parts must be inside <DropdownMenu>.");
  }
  return context;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenuContext value={{ id, open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext>
  );
}

function DropdownMenuTrigger({
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { id, open, triggerRef } = useDropdownMenu();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={triggerRef}
      data-slot="dropdown-menu-trigger"
      type={asChild ? undefined : "button"}
      popoverTarget={id}
      aria-haspopup="menu"
      aria-expanded={open}
      {...props}
    />
  );
}

function menuItems(menu: HTMLElement) {
  return [
    ...menu.querySelectorAll<HTMLButtonElement>(
      "[role=menuitem]:not(:disabled)",
    ),
  ];
}

/** Below the trigger, start-aligned, kept inside the viewport. */
function placeMenu(menu: HTMLElement, trigger: HTMLElement) {
  const gap = 4;
  const margin = 8;
  const anchor = trigger.getBoundingClientRect();
  const { width, height } = menu.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const below = anchor.bottom + gap;
  const top =
    below + height > viewportHeight - margin && anchor.top - gap - height > 0
      ? anchor.top - gap - height
      : below;
  const left = Math.max(
    margin,
    Math.min(anchor.left, viewportWidth - margin - width),
  );
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function DropdownMenuContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { id, open, setOpen, triggerRef } = useDropdownMenu();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = () => ref.current?.hidePopover();
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      role="menu"
      data-slot="dropdown-menu-content"
      onToggle={(event) => {
        const menu = event.currentTarget;
        const isOpen = event.newState === "open";
        setOpen(isOpen);
        if (!isOpen) return;
        if (triggerRef.current) placeMenu(menu, triggerRef.current);
        menu.style.visibility = "";
        menuItems(menu)[0]?.focus();
      }}
      onBeforeToggle={(event) => {
        // Hidden until `onToggle` has measured and placed it.
        if (event.newState === "open") {
          event.currentTarget.style.visibility = "hidden";
        }
      }}
      onKeyDown={(event) => {
        const menu = event.currentTarget;
        if (event.key === "Tab") {
          menu.hidePopover();
          return;
        }
        const items = menuItems(menu);
        const index = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next = {
          ArrowDown: items[(index + 1) % items.length],
          ArrowUp: items[(index - 1 + items.length) % items.length],
          Home: items[0],
          End: items.at(-1),
        }[event.key];
        if (next) {
          event.preventDefault();
          next.focus();
        }
      }}
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 open:animate-in open:fade-in-0 open:zoom-in-95 inset-auto m-0 max-h-[calc(100dvh-1rem)] min-w-32 overflow-x-hidden overflow-y-auto rounded-lg p-1 shadow-md ring-1 duration-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-slot="dropdown-menu-item"
      data-variant={variant}
      onClick={(event) => {
        event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
        onClick?.(event);
      }}
      className={cn(
        "group/dropdown-menu-item focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:*:[svg]:text-destructive relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
};
