import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

async function fetchWebsitePagesData(
  token: string,
  websiteIds?: number[],
  page?: number,
  limit?: number,
) {
  const url = new URL(
    "https://get.mosaicimg.com/api/websites/latest_website_pages",
  );
  if (websiteIds) {
    for (const websiteId of websiteIds) {
      url.searchParams.append("website_ids", websiteId.toString());
    }
  }
  if (page) {
    url.searchParams.append("page", page.toString());
  } else {
    url.searchParams.append("page", "1");
  }
  if (limit) {
    url.searchParams.append("limit", limit.toString());
  } else {
    url.searchParams.append("limit", "10");
  }

  console.log(url.toString());

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

interface FetchWebsitePagesDataProps {
  slug?: string;
  websiteIds?: number[];
  page?: number;
  limit?: number;
}

interface WebsitePagesResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const FetchWebsitePagesData = async ({
  slug,
  websiteIds,
  page,
  limit,
}: FetchWebsitePagesDataProps): Promise<WebsitePagesResponse> => {
  let response: WebsitePagesResponse = {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  };
  if (slug) {
    websiteIds = [parseInt(slug)];
  }
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      response = await fetchWebsitePagesData(token, websiteIds, page, limit);
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return response;
};

export default FetchWebsitePagesData;
