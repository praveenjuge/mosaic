"use client";

import {
  AlertDialog,
  AlertDialogAction,
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
import { Dots, Edit, Repeat, Trash } from "@mynaui/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { handleDelete, handleEdit, handleRefresh } from "./actions";
import { SubmitButton } from "./submit-button";

interface WebsiteActionsProps {
  websiteId: string;
  currentUrl: string;
  hasImages?: boolean;
}

export function WebsiteActions({
  websiteId,
  currentUrl,
  hasImages = false,
}: WebsiteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleRefreshAction = async () => {
    setRefreshLoading(true);
    try {
      const result = await handleRefresh(websiteId);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setRefreshOpen(false);
      }
    } catch (error) {
      console.error("Error refreshing website:", error);
      toast.error("Failed to refresh website. Please try again.");
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8">
            <Dots className="size-8 stroke-2" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {hasImages && (
            <DropdownMenuItem onClick={() => setRefreshOpen(true)}>
              <Repeat className="size-4 stroke-2" />
              Refresh OG Images
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="size-4 stroke-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash className="size-4 stroke-2" />
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
          <form
            className="grid gap-4"
            action={async (formData) => {
              const { status, message } = await handleEdit(formData, websiteId);
              if (status === "error") {
                toast.error(message);
              } else {
                setEditOpen(false);
                toast.success(message);
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="text"
                placeholder="example.com or https://example.com"
                defaultValue={currentUrl}
                required
              />
            </div>
            <SubmitButton text="Save" />
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Website</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this website? This action cannot
              be undone.
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
                    setDeleteOpen(false);
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

      {/* Refresh Alert Dialog */}
      <AlertDialog open={refreshOpen} onOpenChange={setRefreshOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/refresh-image.png"
              alt="OG Image Refresh"
              width={250}
              height={250}
            />
            <AlertDialogTitle>
              Refresh this site&apos;s OG images?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all existing OG images for this site. New images
              will be generated automatically when you visit the pages again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefreshAction}
              disabled={refreshLoading}
            >
              {refreshLoading ? "Refreshing..." : "Yes, Refresh OG Images"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
