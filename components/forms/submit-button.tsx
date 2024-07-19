"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";

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
      {pending ? "Loading..." : text}
    </Button>
  );
}
