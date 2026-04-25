// ── Site Types ──────────────────────────────────────────────────────

export interface Site {
  id: number;
  user_id: string;
  url_base: string;
  image_count: number;
  r2_prefix: string;
  created_at: string;
  refreshed_at: string | null;
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

/** Row shape returned by the recent-images JOIN query in stats. */
export interface RecentImageRow {
  id: number;
  site_id: number;
  key: string;
  page_url: string;
  size_in_bytes: number;
  generated_at: number;
  created_at: string;
  url_base: string;
}

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
    refreshed_at: string | null;
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

// ── OG Types ────────────────────────────────────────────────────────

/** Lightweight site info used by the /use OG generation endpoint. */
export type SiteSummary = {
  siteId: number;
  url_base: string;
  r2Prefix: string;
};
