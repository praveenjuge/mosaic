"use client";

import { LoadingSpinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { backend_url } from "@/lib/constants";
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
    <Button
      size="sm"
      variant="outline"
      disabled={pending || loading}
      aria-disabled={pending || loading}
      onClick={handleRefresh}
    >
      {loading ? <LoadingSpinner /> : "Refresh Site"}
    </Button>
  );
}
