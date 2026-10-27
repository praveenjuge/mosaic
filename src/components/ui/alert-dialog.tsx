import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogTrigger,
  ModalDialog,
  useDialog,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * shadcn's AlertDialog API on the native `<dialog>` (see `dialog.tsx`).
 * Unlike a dialog, a click on the backdrop doesn't dismiss it.
 */

const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"dialog"> & {
  size?: "default" | "sm";
}) {
  const { open } = useDialog();
  if (!open) return null;

  return (
    <ModalDialog
      dismissible={false}
      role="alertdialog"
      data-slot="alert-dialog-content"
      data-size={size}
      className={cn(
        "group/alert-dialog-content w-full data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return (
    <h2
      id={titleId}
      data-slot="alert-dialog-title"
      className={cn(
        "font-heading text-base font-medium wrap-anywhere",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={descriptionId}
      data-slot="alert-dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DialogClose asChild>
      <Button
        data-slot="alert-dialog-cancel"
        variant={variant}
        size={size}
        {...props}
      />
    </DialogClose>
  );
}

export {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};
