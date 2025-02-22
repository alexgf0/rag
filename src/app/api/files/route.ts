import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { ensureUploadsDir, uploadsDir } from "@/lib/file-utils"

export async function GET() {
  ensureUploadsDir()

  const files = fs.readdirSync(uploadsDir).map((filename) => {
    const filePath = path.join(uploadsDir, filename)
    const stats = fs.statSync(filePath)
    return {
      name: filename,
      size: stats.size,
      type: path.extname(filename).slice(1),
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    }
  })

  return NextResponse.json({ files })
}

