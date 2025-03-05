import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { uploadsDir } from "@/lib/file-utils"
import mime from "mime-types"

export async function GET(
  request: Request,
) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Sanitize the filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename)
    const filePath = path.join(uploadsDir, sanitizedFilename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine content type based on file extension
    const contentType = mime.lookup(sanitizedFilename) || 'application/octet-stream'
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
} 