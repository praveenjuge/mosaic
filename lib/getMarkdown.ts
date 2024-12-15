import fs from "fs";
import path from "path";
import matter from "gray-matter";
import markdownToHtml from "./markdownToHtml";

export const getMarkDownContent = (folder: string, slug: string) => {
  const file = `${folder}${slug}.md`;
  const data = matter(fs.readFileSync(file, "utf8"));

  return {
    content: markdownToHtml(data.content),
    title: data.data.title as string,
    slug: file.replace(".md", "") as string,
    publishedAt: data.data.publishedAt as Date,
    description: data.data.description as string,
  };
};

export const getMarkDownData = (folder: string) => {
  const files = fs.readdirSync(folder);
  const markdownPosts = files.filter((file) => file.endsWith(".md"));

  const postsData = markdownPosts.map((file) => {
    const filePath = path.join(folder, file);
    const data = matter(fs.readFileSync(filePath, "utf8"));

    return {
      content: markdownToHtml(data.content),
      title: data.data.title as string,
      slug: file.replace(".md", "") as string,
      publishedAt: data.data.publishedAt as Date,
      description: data.data.description as string,
      category: data.data.category
    };
  });

  return postsData.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
};
