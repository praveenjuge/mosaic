import { SignedOut } from "@clerk/nextjs";
import { Earth } from "@mynaui/icons-react";

export default function WebsitesSignedOut() {
  return (
    <SignedOut>
      <div className="flex w-full flex-col items-center justify-center rounded border-[0.5px] bg-primary-foreground px-4 py-20 text-center">
        <div className="mx-auto rounded-full border-[0.5px] bg-background p-2">
          <Earth className="size-6" />
        </div>
        <h3 className="mb-1 mt-2 text-sm font-medium">
          Add your websites here
        </h3>
        <p className="mb-4 text-balance text-sm text-muted-foreground">
          When you add a website you will get a special URL to get your
          OG Images for that website.
        </p>
      </div>
    </SignedOut>
  );
}
