-- Newsletter subscribers (replaces the DynamoDB table of v1).
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'fr',
  created_at TEXT NOT NULL
);
