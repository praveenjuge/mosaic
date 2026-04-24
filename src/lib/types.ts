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
  total_images: number;
  can_generate_more: boolean;
  has_exceeded_limit: boolean;
  images_limit: number;
  websites: Array<{
    id: number;
    url_base: string;
    image_count: number;
    created_at: string;
  }>;
  latest_screenshots: Array<{
    id: number;
    site_id: number;
    key: string;
    page_url: string;
    size_in_bytes: number;
    generated_at: number;
    url_base: string;
  }>;
};
