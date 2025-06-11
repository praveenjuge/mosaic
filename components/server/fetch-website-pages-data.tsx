// DEPRECATED COMPONENT
// This component was used to fetch data from the external get.mosaicimg.com service
// The external service has been discontinued and all functionality moved to internal database operations
// Use functions from @/lib/database-helpers.ts instead

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

// DEPRECATED: External service fetch has been disabled
// This component previously fetched data from get.mosaicimg.com external service
// All functionality has been migrated to internal database operations
async function fetchWebsitePagesData(
  token: string,
  websiteIds?: number[],
  page?: number,
  limit?: number,
) {
  console.warn(
    "External service fetch has been disabled - use database helpers instead",
  );
  // Return empty data structure to maintain compatibility
  return {
    data: [],
    meta: {
      total: 0,
      page: page || 1,
      limit: limit || 10,
    },
  };
}

export interface FetchWebsitePagesDataProps {
  slug?: string;
  websiteIds?: number[];
  page?: number;
  limit?: number;
}

export interface WebsitePageData {
  id: string;
  image_key: string;
  title: string;
  page_url: string;
  size_in_bytes: number;
  updated_at: string; // This is in UTC
}

interface WebsitePagesResponse {
  data: WebsitePageData[];
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
    const { getToken } = await auth();
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
