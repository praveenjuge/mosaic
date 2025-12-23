"use client";

import { LoadingSpinner } from "@/components/spinner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

interface WebsiteActionsProps {
  websiteId: Id<"sites">;
  currentUrl: string;
}

export function WebsiteActions({ websiteId, currentUrl }: WebsiteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const editSite = useMutation(api.sites.editSite);
  const deleteSite = useAction(api.sites.deleteSite);

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("website")?.toString() || "";

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await editSite({
        siteId: websiteId,
        url_base: url,
      });
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setEditOpen(false);
      }
    } catch (error) {
      console.error("Error editing website:", error);
      toast.error("Failed to update website. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAction = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSite({ siteId: websiteId });
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setDeleteOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete website. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8">
            <Ellipsis className="stroke-2" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="stroke-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash className="stroke-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Website</DialogTitle>
            <DialogDescription>
              Enter the new URL for the website.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleEditSubmit}>
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

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <Image
              src="/illustrations/delete-website.png"
              alt="Delete Website"
              width={300}
              height={300}
            />
            <AlertDialogTitle className="text-center text-balance">
              Delete Website {currentUrl}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-balance">
              Are you sure you want to delete this website? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAction}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingSpinner size={18} /> : "Yes, Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
