"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { handleDelete } from "./actions";
import { SubmitButton } from "./submit-button";

export function DeleteWebsite({ websiteId }: { websiteId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/delete-website.png"
            alt="Delete Website Illustration"
            width={225}
            height={225}
          />
          <AlertDialogTitle>Delete Website</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this website? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async () => {
              try {
                const result = await handleDelete(websiteId);
                if (result.status === "error") {
                  toast.error(result.message);
                } else {
                  setOpen(false);
                  toast.success(result.message);
                }
              } catch (error) {
                console.error("Delete error:", error);
                toast.error("Failed to delete website. Please try again.");
              }
            }}
          >
            <SubmitButton text="Yes, Delete" variant="destructive" />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
