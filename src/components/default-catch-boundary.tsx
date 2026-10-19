import { Button } from "@/components/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-destructive font-mono text-sm font-medium">Error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-3">
        {error instanceof Error ? error.message : "Unexpected error"}
      </p>
      <div className="mt-8 flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try Again
        </Button>
        <Button onClick={() => router.navigate({ to: "/" })}>Go Home</Button>
      </div>
    </div>
  );
}
