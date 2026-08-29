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

export type DashboardStats = {
  total_websites: number;
  websites: Array<{
    id: number;
    url_base: string;
    created_at: string;
  }>;
};

// ── OG Types ────────────────────────────────────────────────────────
