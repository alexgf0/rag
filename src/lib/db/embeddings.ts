import { QueryResult } from "pg"
import { pool } from "./db"
  

export interface EmbeddingVector {
  id?: number
  filename: string
  content: string
  model: string
  embeddings: number[][]
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
      const { filename, content, model, embeddings } = embeddingInfo
      const result: QueryResult = await pool.query(
        "INSERT INTO embedding_vector (id, filename, content, model, embeddings) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *",
        [filename, content, model, embeddings],
      )
    
      if (result.rows.length === 0) {
        return undefined
      }
    
      const row = result.rows[0]
      return {
        id: row.id,
        filename: row.filename,
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
        content: row.content,
        model: row.model,
        embeddings: row.embeddings,
      } : undefined)
    }

    static async update(embeddingInfo: EmbeddingVector): Promise<EmbeddingVector | undefined> {
      const { id, filename, content, model, embeddings } = embeddingInfo
      const result: QueryResult = await pool.query(
        "UPDATE embedding_vector SET filename= $2, content = $3, model = $4, embeddings = $5 WHERE id = $1 RETURNING *",
        [id, filename, content, model, embeddings],
      )
    
      if (result.rows.length === 0) {
        return undefined
      }
    
      const row = result.rows[0]
      return {
        id: row.id,
        filename: row.filename,
        content: row.content,
        model: row.model,
        embeddings: row.embeddings,
      }
    }
    
    static async delete(filter: EmbeddingFilter): Promise<boolean | undefined> {
      const result: QueryResult = await pool.query(
        "DELETE FROM embedding_vector" +
        ' ($1::int IS null OR id = $1)' +
        ' AND ($2::text IS null OR filename = $2)',
        [filter.id, filter.filename])

      if (result.rowCount)
          return result.rowCount > 0
    }
}