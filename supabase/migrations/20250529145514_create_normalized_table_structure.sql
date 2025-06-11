-- Create new table structure for improved organization
-- This migration creates three new tables: websites_new, pages_new, and screenshots_new

-- Websites table to store base website information
CREATE TABLE IF NOT EXISTS websites_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- FK to Users.id (from Clerk)
    url_base TEXT NOT NULL, -- e.g. https://mydomain.com
    site_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages table to store individual pages/paths for each website
CREATE TABLE IF NOT EXISTS pages_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites_new(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- e.g. /pricing, /about, / (for homepage)
    full_url TEXT NOT NULL, -- computed or stored full URL
    title TEXT, -- optional, for labeling
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshots table to store screenshot data for each page
CREATE TABLE IF NOT EXISTS screenshots_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages_new(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL, -- stored in S3/R2/etc.
    image_hash TEXT, -- optional, for cache validation
    size_in_bytes BIGINT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_new_user_id ON websites_new(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_new_url_base ON websites_new(url_base);
CREATE INDEX IF NOT EXISTS idx_pages_new_website_id ON pages_new(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_new_full_url ON pages_new(full_url);
CREATE INDEX IF NOT EXISTS idx_screenshots_new_page_id ON screenshots_new(page_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_website_user_url ON websites_new(user_id, url_base);
CREATE UNIQUE INDEX IF NOT EXISTS unique_page_website_path ON pages_new(website_id, path);

-- Add Row Level Security (RLS) policies
ALTER TABLE websites_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots_new ENABLE ROW LEVEL SECURITY;

-- RLS Policies for websites_new
CREATE POLICY "Users can view their own websites" ON websites_new
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own websites" ON websites_new
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Allow public/API access for websites
CREATE POLICY "Allow public API access for websites" ON websites_new
    FOR ALL USING (user_id = 'public');

CREATE POLICY "Users can update their own websites" ON websites_new
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own websites" ON websites_new
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- RLS Policies for pages_new
CREATE POLICY "Users can view pages of their websites" ON pages_new
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert pages for their websites" ON pages_new
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Allow public/API access for pages
CREATE POLICY "Allow public API access for pages" ON pages_new
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = 'public'
        )
    );

CREATE POLICY "Users can update pages of their websites" ON pages_new
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete pages of their websites" ON pages_new
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for screenshots_new
CREATE POLICY "Users can view screenshots of their pages" ON screenshots_new
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert screenshots for their pages" ON screenshots_new
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Allow public/API access for screenshots
CREATE POLICY "Allow public API access for screenshots" ON screenshots_new
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = 'public'
        )
    );

CREATE POLICY "Users can update screenshots of their pages" ON screenshots_new
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete screenshots of their pages" ON screenshots_new
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_websites_new_updated_at 
    BEFORE UPDATE ON websites_new 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_new_updated_at 
    BEFORE UPDATE ON pages_new 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();