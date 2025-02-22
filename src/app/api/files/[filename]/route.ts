import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { uploadsDir } from "@/lib/file-utils"

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const filename = params.filename
  const filePath = path.join(uploadsDir, filename)

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

export async function DELETE(request: Request, { params }: { params: { filename: string } }) {
  const filename = params.filename
  const filePath = path.join(uploadsDir, filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  try {
    fs.unlinkSync(filePath)
    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

