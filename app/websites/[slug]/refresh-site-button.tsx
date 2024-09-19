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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { backend_url } from "@/lib/constants";
import { Repeat } from "@mynaui/icons-react";
import React from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

interface RefreshSiteButtonProps {
  token: string;
  websiteId: string;
}

export function RefreshSiteButton({
  token,
  websiteId,
}: RefreshSiteButtonProps) {
  const { pending } = useFormStatus();
  const [loading, setLoading] = React.useState(false);

  const handleRefresh = async () => {
    setLoading(true);

    if (token) {
      const response = await fetch(
        `${backend_url}websites/${websiteId}/refresh`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      try {
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error(error);
      }
    }
    setLoading(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || loading}
          aria-disabled={pending || loading}
        >
          <Repeat className="mr-2 size-4 stroke-2" />
          Refresh OG Images
        </Button>
      </AlertDialogTrigger>
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
            This will generate new OG images for this site. This will take a
            little while to complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefresh}>
            Yes, Refresh Images
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
