// Current table structure types (legacy)
export interface Website {
  id: string;
  website_url: string;
  cleaned_website_url: string;
  title?: string | null;
  favicon_url?: string | null;
  total_count?: number;
  created_at?: string;
  updated_at?: string;
}

// New table structure types
export interface Site {
  id: string;
  user_id: string;
  url_base: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  website_id: string;
  path: string;
  full_url: string;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  id: string;
  page_id: string;
  screenshot_url: string;
  image_hash: string | null;
  size_in_bytes: number | null;
  generated_at: string;
}

// Extended types with relations
export interface PageWithSite extends Page {
  sites: Site;
}

export interface ScreenshotWithPage extends Screenshot {
  pages: PageWithSite;
}

export interface SiteWithStats extends Site {
  screenshot_count: number;
}

export interface ScreenshotWithDetails {
  id: string;
  screenshot_url: string;
  size_in_bytes: number;
  generated_at: string | null;
  page_title: string | null;
  page_url: string;
  website_name?: string; // Optional for when used with specific website
}
