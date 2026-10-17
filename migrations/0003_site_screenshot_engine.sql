-- Migration number: 0003 	 2026-10-17T08:25:07.754Z

-- Per-site Browser Run engine. Kitesurf is cheaper but not pixel-perfect, so
-- each user opts in per website. Images are shared per page URL across every
-- user who saved the hostname, so generation only uses Kitesurf when all of
-- them chose it. Existing sites keep Chromium through the default.
ALTER TABLE sites
  ADD COLUMN screenshot_engine TEXT NOT NULL DEFAULT 'chromium'
  CHECK (screenshot_engine IN ('chromium', 'kitesurf'));
