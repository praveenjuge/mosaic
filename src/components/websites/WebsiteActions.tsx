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
import { useState } from "react";
import { useWebsiteActions } from "./use-website-actions";
import { WebsiteUrlForm } from "./website-url-form";

interface WebsiteActionsProps {
  websiteId: number;
  currentUrl: string;
}

export function WebsiteActions({ websiteId, currentUrl }: WebsiteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { removeWebsite, refreshWebsite, saveWebsite } = useWebsiteActions();

  const handleEditSubmit = async (url: string) => {
    setIsSaving(true);

    try {
      const didSave = await saveWebsite({ siteId: websiteId, url });

      if (didSave) {
        setEditOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAction = async () => {
    setIsDeleting(true);

    try {
      const didDelete = await removeWebsite(websiteId);

      if (didDelete) {
        setDeleteOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshAction = async () => {
    setIsRefreshing(true);

    try {
      const didRefresh = await refreshWebsite(websiteId);

      if (didRefresh) {
        setRefreshOpen(false);
      }
    } finally {
      setIsRefreshing(false);
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
        <DropdownMenuContent className="min-w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="stroke-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRefreshOpen(true)}>
            <RefreshCcw className="stroke-2" />
            Refresh Images
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

      {/* Refresh Alert Dialog */}
      <AlertDialog open={refreshOpen} onOpenChange={setRefreshOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <img
              src="/illustrations/refresh-image.png"
              alt="Refresh Images"
              width={300}
              height={300}
              className="w-full"
            />
            <AlertDialogTitle>
              Refresh Images for {currentUrl}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All existing OG images will be deleted and regenerated on next
              request. This may briefly affect social media previews until new
              images are created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefreshing}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleRefreshAction} disabled={isRefreshing}>
              {isRefreshing ? <LoadingSpinner size={18} /> : "Yes, Refresh"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <img
              src="/illustrations/delete-website.png"
              alt="Delete Website"
              width={300}
              height={300}
              className="w-full"
            />
            <AlertDialogTitle>
              Delete Website {currentUrl}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this website? This action cannot
              be undone.
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
