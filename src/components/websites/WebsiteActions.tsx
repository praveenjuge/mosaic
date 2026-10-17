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
import { Ellipsis, Pencil, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { useWebsiteActions } from "./use-website-actions";
import { WebsiteUrlForm } from "./website-url-form";

interface WebsiteActionsProps {
  websiteId: number;
  currentUrl: string;
}

export function WebsiteActions({ websiteId, currentUrl }: WebsiteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const { removeWebsite, saveWebsite } = useWebsiteActions();

  const handleEditSubmit = (url: string) => {
    startSaving(async () => {
      if (await saveWebsite({ siteId: websiteId, url })) setEditOpen(false);
    });
  };

  const handleDeleteAction = () => {
    startDeleting(async () => {
      if (await removeWebsite(websiteId)) setDeleteOpen(false);
    });
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
        <DropdownMenuContent className="min-w-40">
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
          <WebsiteUrlForm
            defaultValue={currentUrl}
            isSubmitting={isSaving}
            onSubmit={handleEditSubmit}
            submitLabel="Save"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <img
              src="/illustrations/delete-website-720w-cb3544ac.webp"
              alt="Delete Website"
              width={300}
              height={200}
              className="w-full"
            />
            <AlertDialogTitle>Delete Website {currentUrl}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the website from your account. Shared cached images
              are unaffected and continue refreshing automatically while any
              Mosaic user has this hostname saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
