import { LoadingSpinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";

type WebsiteUrlFormProps = {
  defaultValue?: string;
  isSubmitting: boolean;
  onSubmit: (url: string) => void | Promise<void>;
  submitLabel: string;
};

export function WebsiteUrlForm({
  defaultValue,
  isSubmitting,
  onSubmit,
  submitLabel,
}: WebsiteUrlFormProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("website")?.toString() ?? "";

    await onSubmit(url);
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="text"
          placeholder="example.com or https://example.com"
          defaultValue={defaultValue}
          required
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoadingSpinner size={18} /> : submitLabel}
      </Button>
    </form>
  );
}
