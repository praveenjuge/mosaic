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

// ── Quota Types ─────────────────────────────────────────────────────

// ── Dashboard Types ─────────────────────────────────────────────────

export type DashboardImageSummary = {
  key: string;
  page_url: string;
  size_in_bytes: number;
  generated_at: number;
  url_base: string;
};

export type DashboardStats = {
  total_websites: number;
  total_images: number;
  websites: Array<{
    id: number;
    url_base: string;
    image_count: number;
    created_at: string;
    last_generated_at: number | null;
  }>;
  latest_screenshots: DashboardImageSummary[];
};

// ── OG Types ────────────────────────────────────────────────────────
