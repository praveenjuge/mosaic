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
import { createClient } from "@/lib/server";
import { Pen } from "@mynaui/icons-react";

export async function EditWebsite({
  websiteId,
  currentUrl,
}: {
  websiteId: string;
  currentUrl?: string;
}) {
  const handleSubmit = async (formData: FormData) => {
    "use server";

    const url = formData.get("website")?.toString() || "";
    const client = await createClient();
    const { data, error } = await client
      .from("websites")
      .update({ website_url: url })
      .eq("id", websiteId)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pen className="size-5" />
          <span className="sr-only">Edit Website</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>
            Enter the new URL for the website.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" action={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="Enter new URL"
              defaultValue={currentUrl}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
