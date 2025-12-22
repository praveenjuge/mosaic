import type { Doc, Id } from "@/convex/_generated/dataModel";

// New table structure types
export type Site = Doc<"sites">;
export type Page = Doc<"pages">;
export type Screenshot = Doc<"screenshots">;

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
  id: Id<"screenshots">;
  screenshot_url: string;
  size_in_bytes: number;
  generated_at: number | string | null;
  page_title: string | null;
  page_url: string;
  website_name?: string; // Optional for when used with specific website
}

// Markdown content types
export interface MarkdownContent {
  content: string;
  title: string;
  slug: string;
  publishedAt: Date;
  description: string;
  category?: string;
}

// Polar API types
export interface PolarBenefit {
  id: string;
  type: string;
  description?: string;
  properties?: Record<string, string | number | boolean>;
}

export interface PolarMeter {
  id: string;
  name: string;
  slug: string;
  // Add other meter properties as needed
}

export interface PolarCustomerStateSubscription {
  id: string;
  created_at: string;
  modified_at: string;
  status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "trialing" | "unpaid";
  amount: number;
  currency: string;
  recurring_interval: "month" | "year";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  started_at: string;
  ends_at: string | null;
  product_id: string;
  discount_id: string | null;
}

export interface PolarCustomerState {
  id: string;
  created_at: string;
  modified_at: string;
  metadata: Record<string, string | number | boolean>;
  external_id: string | null;
  email: string;
  email_verified: boolean;
  name: string | null;
  organization_id: string;
  deleted_at: string | null;
  active_subscriptions: PolarCustomerStateSubscription[];
  granted_benefits: PolarBenefit[];
  active_meters: PolarMeter[];
  avatar_url: string;
}

export interface UserSubscriptionInfo {
  plan: string;
  plan_properties: {
    websites_limit: number;
    images_limit: number;
    storage_limit?: string;
  };
  is_active: boolean;
  subscription_details?: PolarCustomerStateSubscription;
}
