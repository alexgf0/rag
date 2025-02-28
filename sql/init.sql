CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embedding_vector (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    idx INT,
    content TEXT,
    model TEXT NOT NULL,
    embeddings VECTOR  -- Add dimension if known, e.g., VECTOR(768)
);
