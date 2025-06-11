-- Performance indexes for OG image API
-- Add these to your Supabase database for optimal performance

-- Index for the main lookup query in checkImageInDatabase
CREATE INDEX IF NOT EXISTS idx_screenshots_lookup 
ON screenshots_new (page_id, generated_at DESC);

-- Composite indexes for the upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_user_url 
ON websites_new (user_id, url_base);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_website_path 
ON pages_new (website_id, path);

-- Index for pages lookup
CREATE INDEX IF NOT EXISTS idx_pages_website_path_lookup 
ON pages_new (website_id, path) 
INCLUDE (id);

-- Index for websites lookup  
CREATE INDEX IF NOT EXISTS idx_websites_user_url_lookup 
ON websites_new (user_id, url_base) 
INCLUDE (id);
