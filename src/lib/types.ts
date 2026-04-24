// ── Site Types ──────────────────────────────────────────────────────

export interface Site {
  id: number;
  user_id: string;
  url_base: string;
  image_count: number;
  r2_prefix: string;
  created_at: string;
}

export interface ImageRecord {
  id: number;
  site_id: number;
  key: string;
  page_url: string;
  size_in_bytes: number;
  generated_at: number;
  created_at: string;
}

export interface SiteWithStats extends Site {
  screenshot_count: number;
}

// ── Quota Types ─────────────────────────────────────────────────────

export type QuotaStatus = {
  canGenerateMore: boolean;
  used: number;
  limit: number;
  hasExceededLimit: boolean;
};

// ── Dashboard Types ─────────────────────────────────────────────────

export type DashboardStats = {
  total_websites: number;
  total_websites_display: string;
  total_images: number;
  total_images_display: string;
  can_generate_more: boolean;
  has_exceeded_limit: boolean;
  images_limit: number;
  images_limit_display: string;
  websites: Array<{
    id: number;
    url_base: string;
    full_url: string;
    og_image_usage_url: string;
    favicon_url: string;
    created_at: string;
  }>;
  screenshot_counts: Record<string, number>;
  latest_screenshots: Array<{
    id: string;
    screenshot_url: string;
    size_in_bytes: number;
    generated_at: number;
    formatted_date: string;
    page_url: string;
    display_url: string;
    website_name: string | null;
  }>;
};
