-- Additive anonymous likes and one-level replies for the existing public post-comment service.
-- The source comments remain in the separate Worker; these rows only augment those records.
CREATE TABLE IF NOT EXISTS legacy_post_comment_likes (
  post_id TEXT NOT NULL,
  post_comment_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (post_id, post_comment_id, voter_hash)
) STRICT;

CREATE INDEX IF NOT EXISTS legacy_post_comment_likes_by_comment
  ON legacy_post_comment_likes (post_id, post_comment_id);

CREATE TABLE IF NOT EXISTS legacy_post_comment_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  parent_comment_id TEXT NOT NULL,
  author_hash TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX IF NOT EXISTS legacy_post_comment_replies_by_parent
  ON legacy_post_comment_replies (post_id, parent_comment_id, id);

CREATE TABLE IF NOT EXISTS legacy_post_comment_reply_likes (
  reply_id INTEGER NOT NULL REFERENCES legacy_post_comment_replies(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (reply_id, voter_hash)
) STRICT;

CREATE INDEX IF NOT EXISTS legacy_post_comment_reply_likes_by_reply
  ON legacy_post_comment_reply_likes (reply_id);
