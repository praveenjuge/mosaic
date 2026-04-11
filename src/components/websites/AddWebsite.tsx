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
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function AddWebsite() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSite = useMutation(api.sites.addSite);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawUrl = formData.get("website")?.toString() || "";
    const url = rawUrl.trim();

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSite({ url_base: url });
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        form.reset();
        setOpen(false);
        void router.invalidate();
      }
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Failed to add website. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" strokeWidth={2} />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to add.
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
              required
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner size={18} /> : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
