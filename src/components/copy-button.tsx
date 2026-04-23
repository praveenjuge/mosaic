import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copyToClipboard}
      className="relative size-4 p-0"
      aria-label="Copy URL to clipboard"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition duration-300 ${isCopied ? "scale-0" : "scale-100"}`}
      >
        <Copy className="size-4 stroke-2" />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition duration-300 ${isCopied ? "scale-100" : "scale-0"}`}
      >
        <Check className="size-4 stroke-2 text-primary" />
      </span>
    </Button>
  );
}
