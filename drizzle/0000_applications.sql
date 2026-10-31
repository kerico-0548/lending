CREATE TABLE applications (id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,contact TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
