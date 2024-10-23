import { CopyButton } from "@/components/copy-button";
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
import { Code, ExternalLink, SmileGhost } from "@mynaui/icons-react";

export function WebsiteInfoModal({ websiteUrl }: { websiteUrl: string }) {
  const finalWebsiteUrl = `https://${websiteUrl}`;
  const getMetaTag = (isHomePage: boolean) =>
    `<meta property="og:image" content="https://mosaicimg.com/use?url=${isHomePage ? finalWebsiteUrl : `${finalWebsiteUrl}/slug`}" />`;

  const renderCodeBlock = (content: string) => (
    <div className="relative w-full whitespace-pre-wrap rounded bg-muted p-2 pr-4 font-mono text-xs font-medium">
      <div className="absolute right-2 top-2">
        <CopyButton text={content} />
      </div>
      {content}
    </div>
  );

  const tabContents = {
    "Next.js": `export const metadata = {
  openGraph: {
    images: [
      {
        url: 'https://mosaicimg.com/use?url=${finalWebsiteUrl}',
        width: 1200,
        height: 630,
      },
    ],
  },
}`,
    React: `<Helmet>
  <meta property="og:image" content="https://mosaicimg.com/use?url=${finalWebsiteUrl}" />
</Helmet>`,
    HTML: `<head>
  <meta property="og:image" content="https://mosaicimg.com/use?url=${finalWebsiteUrl}" />
</head>`,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Code className="mr-2 size-4 stroke-2" />
          Add to Your Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <SmileGhost className="mb-2 size-8 shrink-0 text-orange-500 dark:text-orange-300" />
          <DialogTitle className="text-left">
            Let&apos;s add to your website!
          </DialogTitle>
          <DialogDescription className="text-left">
            Showcase your beautiful website when sharing in social platforms.
          </DialogDescription>
        </DialogHeader>
        <DialogDescription className="space-y-4 text-sm">
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
                {renderCodeBlock(getMetaTag(tab === "home"))}
              </TabsContent>
            ))}
          </Tabs>

          <div className="w-full border-t-[0.5px]" />

          <Tabs defaultValue="Next.js">
            <TabsList className="w-full">
              {Object.keys(tabContents).map((tab) => (
                <TabsTrigger key={tab} className="w-full" value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(tabContents).map(([tab, content]) => (
              <TabsContent key={tab} value={tab}>
                <p className="mb-2">
                  {tab === "Next.js"
                    ? "Add the meta tag to your page metadata export in Next.js:"
                    : tab === "React"
                      ? "Use a library like react-helmet to add the meta tag:"
                      : "Add the meta tag to your HTML head:"}
                </p>
                {renderCodeBlock(content)}
              </TabsContent>
            ))}
          </Tabs>

          <div className="w-full border-t-[0.5px]" />

          {["Learn more about Open Graph", "Validate your metadata"].map(
            (text, index) => (
              <a
                key={index}
                href={index === 0 ? "https://ogp.me/" : "https://metatags.io/"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center font-medium text-primary"
              >
                {text} <ExternalLink className="ml-1 size-3.5 stroke-2" />
              </a>
            ),
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
