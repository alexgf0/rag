import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import ollama from 'ollama'
import { ensureFileExists, extractFileContents, uploadsDir } from "@/lib/file-utils"
import { EmbeddingUtils } from "@/lib/db/embeddings"


// get embedding
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const filePath = path.join(uploadsDir, filename || '');

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


// create embedding
export async function POST(request: Request) {
  try {
    const body = await request.json()
  
    if (typeof body.filename != 'string') {
        return NextResponse.json({ message: "Specify a filename" }, { status: 400 })
    }

    if (!(await ensureFileExists(body.filename))) {
        return NextResponse.json({ message: "Filename not found" }, { status: 404 })
    }

    // check that the file doesn't already have their embeddings calculate
    const embeddings = await EmbeddingUtils.get({filename: body.filename})

    if (embeddings) {
      return NextResponse.json(embeddings)
    }
    const contents = await extractFileContents(body.filename)

    const model_response = await ollama.embed({
        model: "deepseek-r1:1.5b",
        input: contents
    })

    const newEmbeddings = await EmbeddingUtils.create(
      {
        filename: body.filename,
        content: contents,
        model: model_response.model,
        embeddings: model_response.embeddings
      }
    )

    if (newEmbeddings) {
        return NextResponse.json(newEmbeddings)
    }

    return NextResponse.json({ message: "could not create embeddings" }, { status: 500 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ message: "Failed to extract embeddings" }, { status: 500 })
  }
}



