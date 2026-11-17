import { Button } from "@/components/ui/button";
import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";
import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "vadivam-react";

/**
 * shadcn's Dialog API on the native `<dialog>` element, which brings the
 * focus trap, Escape, inert background, and top layer that Radix otherwise
 * ships as JavaScript. Content is mounted only while open, as with Radix.
 */

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("Dialog parts must be inside <Dialog>.");
  return context;
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const titleId = React.useId();
  const descriptionId = React.useId();
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <DialogContext value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext>
  );
}

function DialogTrigger({
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen } = useDialog();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="dialog-trigger"
      type={asChild ? undefined : "button"}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(true);
      }}
      {...props}
    />
  );
}

function DialogClose({
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useDialog();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="dialog-close"
      type={asChild ? undefined : "button"}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
}

/**
 * The open `<dialog>`, shown modally. Escape and, when `dismissible`, a click
 * on the backdrop ask the owner to close it; closing returns focus to the
 * element that opened it. It renders into `<body>`, like Radix's portal, so
 * it doesn't inherit styles from where it's used (a table cell's `nowrap`).
 */
function ModalDialog({
  dismissible,
  className,
  children,
  ...props
}: React.ComponentProps<"dialog"> & { dismissible: boolean }) {
  const { setOpen, titleId, descriptionId } = useDialog();
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      // `close()`, unlike removing the element, restores focus.
      if (dialog.open) dialog.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      // Browsers may close it themselves after repeated Escape presses. The
      // event arrives later, so it is stale if the dialog has reopened since
      // (as when development's StrictMode remounts it).
      onClose={(event) => {
        if (!event.currentTarget.open) setOpen(false);
      }}
      onClick={(event) => {
        if (!dismissible || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) setOpen(false);
      }}
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 zoom-in-95 backdrop:animate-in backdrop:fade-in-0 m-auto grid-cols-[minmax(0,1fr)] gap-4 rounded-xl p-4 ring-1 duration-100 outline-none backdrop:bg-black/10 backdrop:duration-100 open:grid supports-backdrop-filter:backdrop:backdrop-blur-xs",
        className,
      )}
      {...props}
    >
      {children}
    </dialog>,
    document.body,
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"dialog"> & {
  showCloseButton?: boolean;
}) {
  const { open } = useDialog();
  if (!open) return null;

  return (
    <ModalDialog
      dismissible
      data-slot="dialog-content"
      className={cn(
        "w-full max-w-[calc(100%-2rem)] text-sm sm:max-w-sm",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button
            variant="ghost"
            className="absolute top-2 right-2"
            size="icon-sm"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
      )}
    </ModalDialog>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return (
    <h2
      id={titleId}
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium wrap-anywhere",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={descriptionId}
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ModalDialog,
  useDialog,
};
