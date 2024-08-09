"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { ExternalLink, Plus } from "@mynaui/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { handleAdd } from "./actions";
import { SubmitButton } from "./submit-button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export function AddWebsite({ preventSubmission = false }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" stroke={2} />
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
        <form
          className="grid gap-4"
          action={async (formData) => {
            await handleAdd(formData);
            setOpen(false);
            toast.success("Added your website!");
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="Enter URL"
              required
            />
          </div>
          {preventSubmission ? (
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default" })}
              href="/subscriptions"
            >
              Upgrade to Pro
              <ExternalLink className="ml-2 size-4" strokeWidth={2} />
            </Link>
          ) : (
            <SubmitButton text="Add" />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
