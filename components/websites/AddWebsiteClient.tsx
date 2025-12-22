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
import { cleanUrl } from "@/lib/utils";
import { SignInButton, useClerk } from "@clerk/nextjs";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function AddWebsiteClient({
  websitesLimit,
}: {
  websitesLimit: number;
}) {
  const { openUserProfile } = useClerk();
  const websiteCount = useQuery(api.sites.countForUser);
  const addSite = useMutation(api.sites.addSite);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLimitLoading = websiteCount === undefined;
  const preventSubmission =
    websiteCount !== undefined && websiteCount >= websitesLimit;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("website")?.toString() || "";
    const cleanedUrl = cleanUrl(url);

    if (!cleanedUrl) {
      toast.error("Please enter a valid website URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSite({ url_base: cleanedUrl });
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        event.currentTarget.reset();
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Failed to add website. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthLoading>
        <Button size="sm" disabled>
          <Plus className="size-4" strokeWidth={2} />
          Add Website
        </Button>
      </AuthLoading>

      <Authenticated>
        {isLimitLoading ? (
          <Button size="sm" disabled>
            <Plus className="size-4" strokeWidth={2} />
            Add Website
          </Button>
        ) : preventSubmission ? (
          <Button
            size="sm"
            onClick={() => openUserProfile()}
          >
            <Plus className="size-4" strokeWidth={2} />
            Upgrade to Pro
          </Button>
        ) : (
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
        )}
      </Authenticated>

      <Unauthenticated>
        <SignInButton mode="modal" withSignUp={true} oauthFlow="popup">
          <Button size="sm">
            <Plus className="size-4" strokeWidth={2} />
            Add Website
          </Button>
        </SignInButton>
      </Unauthenticated>
    </>
  );
}
