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

export async function AddWebsite() {
  const handleSubmit = async (formData: FormData) => {
    "use server";

    const url = formData.get("website")?.toString() || "";
    const client = await createClient();
    const { data, error } = await client
      .from("websites")
      .insert([{ website_url: url }])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Add Website</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to add.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" action={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="Enter URL"
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
