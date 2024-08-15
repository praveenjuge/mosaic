import {
  author_email,
  author_name,
  website_description,
  website_url,
} from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";
import { Feed } from "feed";
import { load } from "outstatic/server";

export const dynamic = "force-static";

const allPosts = await (await load())
  .find({ collection: "changelog" }, [
    "title",
    "publishedAt",
    "description",
    "content",
    "slug",
  ])
  .sort({ publishedAt: -1 })
  .toArray();

export function GET() {
  const feed = new Feed({
    title: author_name,
    description: website_description,
    id: website_url,
    link: website_url,
    language: "en",
    favicon: `${website_url}favicon.ico`,
    copyright: author_name,
    feedLinks: {
      atom: `${website_url}changelog/rss.xml`,
    },
    author: {
      name: author_name,
      email: author_email,
      link: website_url,
    },
  });

  for (const post of allPosts) {
    const url = `${website_url}changelog/${post.slug}`;
    const content = markdownToHtml(post.content) as string;
    feed.addItem({
      title: post.title || "",
      id: url,
      link: url,
      content: `${post.description}<br />${content}`,
      description: post.description || "",
      date: new Date(post.publishedAt || ""),
      author: [
        {
          name: author_name,
          email: author_email,
          link: website_url,
        },
      ],
    });
  }

  feed.addCategory("Web App");
  feed.addCategory("Technology");

  feed.addContributor({
    name: author_name,
    email: author_email,
    link: website_url,
  });

  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
