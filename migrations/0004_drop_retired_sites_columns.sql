-- Contract step for 0003. No deployed Worker reads or writes these per-site
-- storage columns any more. After this runs, Workers from before 0003 can no
-- longer add websites, so only apply it once rolling back past 0003 is ruled
-- out. None of the columns is indexed, so they can be dropped in place.
ALTER TABLE sites DROP COLUMN image_count;
ALTER TABLE sites DROP COLUMN r2_prefix;
ALTER TABLE sites DROP COLUMN refreshed_at;
