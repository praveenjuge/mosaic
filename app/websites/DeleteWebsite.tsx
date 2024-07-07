import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/server";
import { Trash } from "@mynaui/icons-react";

export async function DeleteWebsite({ websiteId }: { websiteId: string }) {
  const handleDelete = async () => {
    "use server";

    const client = await createClient();
    const { error } = await client
      .from("websites")
      .delete()
      .eq("id", websiteId);

    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" color="red">
          <Trash className="size-5" />
          <span className="sr-only">Delete Website</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Website</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this website? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4">
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">
              Yes, Delete
            </Button>
          </form>
          <DialogTrigger asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
