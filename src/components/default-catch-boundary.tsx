import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";

export function DefaultCatchBoundary({
  error,
  reset,
}: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Unexpected error"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              Try Again
            </Button>
            <Button onClick={() => router.navigate({ to: "/" })}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
