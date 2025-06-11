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
export interface WebsiteNew {
  id: string;
  user_id: string;
  url_base: string;
  site_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageNew {
  id: string;
  website_id: string;
  path: string;
  full_url: string;
  created_at: string;
  updated_at: string;
}

export interface ScreenshotNew {
  id: string;
  page_id: string;
  screenshot_url: string;
  image_hash: string | null;
  size_in_bytes: number | null;
  generated_at: string;
}

// Extended types with relations
export interface PageWithWebsite extends PageNew {
  websites_new: WebsiteNew;
}

export interface ScreenshotWithPage extends ScreenshotNew {
  pages_new: PageWithWebsite;
}

export interface WebsiteWithStats extends WebsiteNew {
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
