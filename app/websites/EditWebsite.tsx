"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { handleEdit } from "./actions";
import { SubmitButton } from "./submit-button";

export function EditWebsite({
  websiteId,
  currentUrl,
}: {
  websiteId: string;
  currentUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>
            Enter the new URL for the website.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          action={async (formData) => {
            await handleEdit(formData, websiteId);
            setOpen(false);
            toast.success("Updated website.");
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="Enter new URL"
              defaultValue={currentUrl}
              required
            />
          </div>
          <SubmitButton text="Save" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
