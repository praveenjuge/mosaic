import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useWebsiteActions } from "./use-website-actions";
import { WebsiteUrlForm } from "./website-url-form";

export default function AddWebsite() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveWebsite } = useWebsiteActions();

  const handleSubmit = async (url: string) => {
    setIsSubmitting(true);

    try {
      const didSave = await saveWebsite({ url });

      if (didSave) {
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        <WebsiteUrlForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel="Add"
        />
      </DialogContent>
    </Dialog>
  );
}
