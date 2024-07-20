"use client";

import { LoadingSpinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  text?: string;
  variant?: any;
}

export function SubmitButton({
  text = "Submit",
  variant = "default",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      variant={variant}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? <LoadingSpinner /> : text}
    </Button>
  );
}
