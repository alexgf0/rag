CREATE TABLE embedding_vector (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT NOT NULL,
  embeddings FLOAT8[][] NOT NULL
);
