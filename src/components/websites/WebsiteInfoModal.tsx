import { CopyButton } from "@/components/copy-button";
import { GuideLink } from "@/components/help/guides";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGuideLinks } from "@/lib/content";
import { publicEnv } from "@/lib/env";
import { buildSiteOgImageUrl } from "@/lib/url";
import { Code, ExternalLink, Ghost } from "lucide-react";

const guideLinks = getGuideLinks();

export function WebsiteInfoModal({ websiteUrl }: { websiteUrl: string }) {
  const finalWebsiteUrl = `https://${decodeURIComponent(websiteUrl)}`;

  const homeMetaTag = `<meta property="og:image" content="${buildSiteOgImageUrl(
    publicEnv.siteUrl,
    finalWebsiteUrl,
  )}" />`;
  const subpageMetaTag = `<meta property="og:image" content="${buildSiteOgImageUrl(
    publicEnv.siteUrl,
    `${finalWebsiteUrl}/your_slug`,
  )}" />`;

  const renderCodeBlock = (content: string) => (
    <div className="bg-muted relative w-full rounded p-2 pr-4 font-mono text-xs font-medium whitespace-pre-wrap">
      <div className="absolute top-2 right-2">
        <CopyButton text={content} />
      </div>
      {content}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7">
          <Code className="size-4 stroke-2" />
          Add to Your Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <Ghost className="mb-2 size-8 shrink-0 text-orange-500 dark:text-orange-300" />
          <DialogTitle className="text-left">
            Let&apos;s add to your website!
          </DialogTitle>
          <DialogDescription className="text-left">
            Showcase your beautiful website when sharing in social platforms.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger className="w-full" value="home">
                Home Page
              </TabsTrigger>
              <TabsTrigger className="w-full" value="subpages">
                Sub Pages
              </TabsTrigger>
            </TabsList>
            {["home", "subpages"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {renderCodeBlock(tab === "home" ? homeMetaTag : subpageMetaTag)}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex flex-wrap gap-2">
            {guideLinks.map((guide) => (
              <GuideLink key={guide.slug} guide={guide} />
            ))}
          </div>

          {["Learn more about Open Graph", "Validate your metadata"].map(
            (text, index) => (
              <a
                key={index}
                href={index === 0 ? "https://ogp.me/" : "https://metatags.io/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center font-medium"
              >
                {text} <ExternalLink className="ml-1 size-3.5 stroke-2" />
              </a>
            ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
