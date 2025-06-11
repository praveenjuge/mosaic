-- Fix RLS policies to allow proper cascade deletes
-- The issue is that CASCADE DELETE operations need to check RLS policies for dependent rows
-- But during cascade operations, the authentication context might not be properly passed

-- First, let's add a more permissive policy for cascade delete operations on pages_new
-- This allows deletion of pages when the parent website is being deleted
CREATE POLICY "Allow cascade delete from websites" ON pages_new
    FOR DELETE USING (
        -- Allow delete if the parent website deletion is in progress
        -- We check if the website belongs to the current user
        EXISTS (
            SELECT 1 FROM websites_new w 
            WHERE w.id = pages_new.website_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Similarly for screenshots_new - allow cascade delete from pages
CREATE POLICY "Allow cascade delete from pages" ON screenshots_new
    FOR DELETE USING (
        -- Allow delete if the parent page deletion is in progress
        -- We check if the page's website belongs to the current user
        EXISTS (
            SELECT 1 FROM pages_new p
            JOIN websites_new w ON w.id = p.website_id
            WHERE p.id = screenshots_new.page_id 
            AND w.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Alternative approach: If the above doesn't work, we can disable RLS temporarily during deletes
-- by using a function with SECURITY DEFINER that bypasses RLS

-- Create a secure function to delete websites with proper cascade
CREATE OR REPLACE FUNCTION delete_user_website(website_id_param UUID, user_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    website_exists BOOLEAN;
BEGIN
    -- Check if website exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM websites_new 
        WHERE id = website_id_param 
        AND user_id = user_id_param
    ) INTO website_exists;
    
    IF NOT website_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Delete the website (cascade will handle dependent records)
    DELETE FROM websites_new 
    WHERE id = website_id_param 
    AND user_id = user_id_param;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_website(UUID, TEXT) TO authenticated;
