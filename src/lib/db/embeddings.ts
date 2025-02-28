import { QueryResult } from "pg"
import { pool } from "./db"
  

export interface EmbeddingVector {
  id?: number
  filename: string
  idx: number
  content: string
  model: string
  embeddings: number[]
}

export interface EmbeddingFilter {
  id?: number
  filename?: string
}

// Utility functions for creating, reading, updating, and deleting embeddings
export class EmbeddingUtils {
  /**
   * Create a new embedding record in the database
   */
  static async create(embeddingInfo: EmbeddingVector): Promise<EmbeddingVector | undefined> {
      const { filename, idx, content, model, embeddings } = embeddingInfo
      const vectorString = `[${embeddings.join(',')}]`; // e.g., '[0.1,0.2,0.3]'

      const result: QueryResult = await pool.query(
        "INSERT INTO embedding_vector (id, filename, idx, content, model, embeddings) VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING *",
        [filename, idx, content, model, vectorString],
      )
    
      if (result.rows.length === 0) {
        return undefined
      }
    
      const row = result.rows[0]
      return {
        id: row.id,
        filename: row.filename,
        idx: row.idx,
        content: row.content,
        model: row.model,
        embeddings: row.embeddings,
      }
    }

    static async get(filter: EmbeddingFilter): Promise<EmbeddingVector | undefined> {
      const result: QueryResult = await pool.query(
        'SELECT * FROM embedding_vector WHERE' +
        ' ($1::int IS null OR id = $1)' +
        ' AND ($2::text IS null OR filename = $2)',
        [filter.id, filter.filename])
  
      const row = result.rowCount ?
        result.rowCount > 0 ? result.rows[0]
        : undefined : undefined

      return (row ? {
        id: row.id,
        filename: row.filename,
        idx: row.idx,
        content: row.content,
        model: row.model,
        embeddings: row.embeddings,
      } : undefined)
    }

    static async update(embeddingInfo: EmbeddingVector): Promise<EmbeddingVector | undefined> {
      const { id, filename, idx, content, model, embeddings } = embeddingInfo
      const result: QueryResult = await pool.query(
        "UPDATE embedding_vector SET filename = $2, idx = $3, content = $4, model = $5, embeddings = $6 WHERE id = $1 RETURNING *",
        [id, filename, idx, content, model, embeddings],
      )
    
      if (result.rows.length === 0) {
        return undefined
      }
    
      const row = result.rows[0]
      return {
        id: row.id,
        filename: row.filename,
        idx: row.idx,
        content: row.content,
        model: row.model,
        embeddings: row.embeddings,
      }
    }
    
    static async delete(filter: EmbeddingFilter): Promise<boolean | undefined> {
      const result: QueryResult = await pool.query(
        "DELETE FROM embedding_vector WHERE" +
        ' ($1::int IS null OR id = $1)' +
        ' AND ($2::text IS null OR filename = $2)',
        [filter.id, filter.filename])

      if (result.rowCount)
          return result.rowCount > 0
    }


    static async getByCosineDistance(refEmbedding: number[], model: string, limit: number): Promise<EmbeddingVector[] | undefined> {
      const vectorString = `[${refEmbedding.join(',')}]`; // e.g., '[0.1,0.2,0.3]'

      const result: QueryResult = await pool.query(`
        SELECT 
            id,
            filename,
            content,
            model,
            embeddings,
            1 - (embeddings <=> $1) as cosine_similarity
        FROM embedding_vector
        WHERE model = $2
        ORDER BY embeddings <=> $1
        LIMIT $3
    `, [vectorString, model, limit]);

      return result.rows
    }
}