-- The dashboard reads each user's images by hostname, newest first, and the
-- latest generation time per hostname. Adding generated_at to the hostname
-- index lets both read images in order from the index instead of sorting
-- every row. The composite index still serves plain hostname lookups, so the
-- single-column one goes. No query names either index.
CREATE INDEX idx_global_images_hostname_generated_at
  ON global_images(hostname, generated_at);

DROP INDEX idx_global_images_hostname;
