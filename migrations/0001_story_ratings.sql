-- Additive and repeatable schema for the story rating Pages Function.
-- Existing production data is not reset or altered by this migration.
CREATE TABLE IF NOT EXISTS story_ratings (
  story_slug TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (story_slug, voter_hash)
) STRICT;

CREATE INDEX IF NOT EXISTS story_ratings_by_story_rating
  ON story_ratings (story_slug, rating);

CREATE TABLE IF NOT EXISTS story_rating_rate_limits (
  voter_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0)
) STRICT;

CREATE INDEX IF NOT EXISTS story_rating_rate_limits_by_window
  ON story_rating_rate_limits (window_started_at);
