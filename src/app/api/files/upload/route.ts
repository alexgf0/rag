import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { ensureUploadsDir, uploadsDir } from "@/lib/file-utils"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    ensureUploadsDir()
    const filePath = path.join(uploadsDir, file.name)
    await writeFile(filePath, buffer)

    return NextResponse.json({ 
      success: true, 
      message: "File uploaded successfully",
      filename: file.name
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, message: "Failed to upload file" }, { status: 500 })
  }
}

