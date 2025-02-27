import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { ensureUploadsDir, uploadsDir } from "@/lib/file-utils"
import { EmbeddingUtils } from "@/lib/db/embeddings"

export async function GET() {
  ensureUploadsDir();
  
  // Get all filenames
  const filenames = fs.readdirSync(uploadsDir);
  
  // Process each file and wait for all promises to resolve
  const files = [];
  for (const filename of filenames) {
    const filePath = path.join(uploadsDir, filename);
    const stats = fs.statSync(filePath);
    const embedding = await EmbeddingUtils.get({filename: filename});
    
    files.push({
      name: filename,
      size: stats.size,
      type: path.extname(filename).slice(1),
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      embedding: embedding
    });
  }
  
  return NextResponse.json({ files });
}

