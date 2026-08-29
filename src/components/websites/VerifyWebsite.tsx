import { CopyButton } from "@/components/copy-button";
import { LoadingSpinner } from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useWebsiteActions } from "./use-website-actions";

interface VerifyWebsiteProps {
  siteId: number;
  hostname: string;
  token: string | null;
  verifiedAt: string | null;
  generationSecret: string | null;
}

function TokenField({ value, label }: { value: string; label: string }) {
  return (
    <span className="border-border mt-2 flex items-center gap-2 border p-2">
      <code className="text-foreground min-w-0 flex-1 break-all">{value}</code>
      <CopyButton text={value} ariaLabel={label} />
    </span>
  );
}

function VerificationInstructions({ url, token }: { url: string; token: string }) {
  return (
    <ol className="text-muted-foreground grid list-decimal gap-4 pl-5 text-sm">
      <li>Create a plain-text file at {url}.</li>
      <li>
        Put only this token in the file:
        <TokenField value={token} label="Copy verification token" />
      </li>
      <li>Publish the file over HTTPS without a redirect, then verify.</li>
    </ol>
  );
}

export function VerifyWebsite({
  siteId,
  hostname,
  token,
  verifiedAt,
  generationSecret,
}: VerifyWebsiteProps) {
  const [open, setOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyWebsite } = useWebsiteActions();

  if (verifiedAt && generationSecret) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <CheckCircle2 className="size-4" />
            Verified
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generation secret</DialogTitle>
            <DialogDescription>
              Sign each exact page URL on your server or during the build. Never
              expose this secret in client-side code.
            </DialogDescription>
          </DialogHeader>
          <TokenField value={generationSecret} label="Copy generation secret" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!token) return <Badge variant="destructive">Verification unavailable</Badge>;

  const path = "/.well-known/mosaic-verification.txt";
  const verificationUrl = `https://${hostname}${path}`;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const verified = await verifyWebsite(siteId);
      if (verified) setOpen(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="size-4" />
          Verify ownership
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify {hostname}</DialogTitle>
          <DialogDescription>
            Prove you control this hostname before Mosaic accepts OG generation
            traffic for it.
          </DialogDescription>
        </DialogHeader>
        <VerificationInstructions url={verificationUrl} token={token} />
        <DialogFooter>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? <LoadingSpinner size={18} /> : "Verify website"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
