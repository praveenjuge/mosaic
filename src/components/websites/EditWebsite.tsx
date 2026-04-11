"use client";

import { api } from "@/convex/_generated/api";
import { LoadingSpinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
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
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function EditWebsite({
  websiteId,
  currentUrl,
}: {
  websiteId: Id<"sites">;
  currentUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const editSite = useMutation(api.sites.editSite);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawUrl = formData.get("website")?.toString() || "";
    const url = rawUrl.trim();

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return;
    }

    setIsSaving(true);
    try {
      const { status, message } = await editSite({
        siteId: websiteId,
        url_base: url,
      });
      if (status === "error") {
        toast.error(message);
      } else {
        toast.success(message);
        setOpen(false);
        void router.invalidate();
      }
    } catch (error) {
      console.error("Error editing website:", error);
      toast.error("Failed to update website. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="text"
              placeholder="example.com or https://example.com"
              defaultValue={currentUrl}
              required
              disabled={isSaving}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <LoadingSpinner size={18} /> : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
