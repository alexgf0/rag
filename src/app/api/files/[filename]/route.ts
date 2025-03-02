import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { uploadsDir } from "@/lib/file-utils"
import { EmbeddingUtils } from "@/lib/db/embeddings"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const filePath = path.join(uploadsDir, filename || '')

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)
  const headers = new Headers()
  headers.set("Content-Disposition", `attachment; filename="${filename}"`)
  headers.set("Content-Type", "application/octet-stream")

  return new NextResponse(fileBuffer, {
    status: 200,
    headers,
  })
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const segments = pathname.split("/");
  const encodedFilename = segments[segments.length - 1];
  // Decode URL-encoded characters in the filename
  const filename = decodeURIComponent(encodedFilename);

  // Validate that a filename was provided
  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }
  const filePath = path.join(uploadsDir, filename || '')
  console.log("filepath : ", filePath)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  await EmbeddingUtils.delete({filename: filename})
  
  try {
    fs.unlinkSync(filePath)
    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

