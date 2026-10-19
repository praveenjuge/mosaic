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
import { Ellipsis, Pencil, RefreshCcw, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { useWebsiteActions } from "./use-website-actions";
import { WebsiteUrlForm } from "./website-url-form";

interface WebsiteActionsProps {
  websiteId: number;
  currentUrl: string;
  imageCount: number;
}

export function WebsiteActions({
  websiteId,
  currentUrl,
  imageCount,
}: WebsiteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isRegenerating, startRegenerating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const { regenerateWebsite, removeWebsite, saveWebsite } = useWebsiteActions();

  const handleEditSubmit = (url: string) => {
    startSaving(async () => {
      if (await saveWebsite({ siteId: websiteId, url })) setEditOpen(false);
    });
  };

  const handleRegenerateAction = () => {
    startRegenerating(async () => {
      if (await regenerateWebsite(websiteId)) setRegenerateOpen(false);
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
          <Button variant="ghost" size="icon-sm">
            <Ellipsis className="stroke-2" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-48">
          <DropdownMenuItem
            onClick={() => {
              setEditOpen(true);
            }}
          >
            <Pencil className="stroke-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={imageCount === 0}
            onClick={() => {
              setRegenerateOpen(true);
            }}
          >
            <RefreshCcw className="stroke-2" />
            Regenerate images
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setDeleteOpen(true);
            }}
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

      {/* Regenerate Alert Dialog */}
      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Regenerate images for {currentUrl}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all {imageCount}{" "}
              {imageCount === 1 ? "image" : "images"} for this website now. Each
              page gets a new screenshot the next time it is requested, so that
              first request is slower. To refresh a single page instead, use
              Regenerate on its image. Images are shared, so this also resets
              them for any other Mosaic user who saved this hostname.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleRegenerateAction}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <LoadingSpinner size={18} />
              ) : (
                "Yes, Regenerate"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
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
