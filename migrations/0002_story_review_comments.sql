-- Add anonymous, rating-linked story comments, one-level replies, and unique likes.
-- Additive and repeatable; existing rating records are not changed.
CREATE TABLE IF NOT EXISTS story_rating_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_slug TEXT NOT NULL,
  author_hash TEXT NOT NULL,
  review_voter_hash TEXT,
  parent_id INTEGER REFERENCES story_rating_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (
    (parent_id IS NULL AND review_voter_hash IS NOT NULL) OR
    (parent_id IS NOT NULL AND review_voter_hash IS NULL)
  ),
  FOREIGN KEY (story_slug, review_voter_hash)
    REFERENCES story_ratings (story_slug, voter_hash) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS story_rating_comments_by_story
  ON story_rating_comments (story_slug, parent_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS story_rating_comments_one_review
  ON story_rating_comments (story_slug, review_voter_hash)
  WHERE parent_id IS NULL;

CREATE TABLE IF NOT EXISTS story_rating_comment_likes (
  comment_id INTEGER NOT NULL REFERENCES story_rating_comments(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (comment_id, voter_hash)
) STRICT;

CREATE INDEX IF NOT EXISTS story_rating_comment_likes_by_comment
  ON story_rating_comment_likes (comment_id);
