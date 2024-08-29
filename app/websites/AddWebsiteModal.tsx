"use client";

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
import { Plus } from "@mynaui/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { handleAdd } from "./actions";
import { SubmitButton } from "./submit-button";

export default function AddWebsiteModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-1 size-4" stroke={2} />
            Add Websites
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
              const { status, message } = await handleAdd(formData);
              if (status === "error") {
                toast.error(message);
              } else {
                setOpen(false);
                toast.success(message);
              }
              setOpen(false);
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
            <SubmitButton text="Add" />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
