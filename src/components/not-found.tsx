import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground text-sm">
            The page you were looking for does not exist.
          </p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Where to go next</h3>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>
                <Link to="/" className="underline underline-offset-4">
                  Home
                </Link>{" "}
                — generate Open Graph images
              </li>
              <li>
                <Link to="/help" className="underline underline-offset-4">
                  Help
                </Link>{" "}
                — guides and how Mosaic works
              </li>
              <li>
                <a href="/sitemap.xml" className="underline underline-offset-4">
                  Sitemap
                </a>{" "}
                — all discoverable pages
              </li>
              <li>
                <a href="/robots.txt" className="underline underline-offset-4">
                  robots.txt
                </a>{" "}
                — crawl rules
              </li>
            </ul>
          </div>

          <pre className="bg-muted overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
            {`# 404 — Not Found

The requested page does not exist.

Try:
- / — Home (https://mosaic.praveenjuge.com/)
- /help — Help & Support (https://mosaic.praveenjuge.com/help)
- /sitemap.xml — Sitemap (https://mosaic.praveenjuge.com/sitemap.xml)
- /robots.txt — Robots (https://mosaic.praveenjuge.com/robots.txt)`}
          </pre>

          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
