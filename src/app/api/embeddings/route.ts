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
  
    if (typeof body.filename !== 'string') {
      return NextResponse.json({ message: "Specify a filename" }, { status: 400 })
    }
    
    if (!(await ensureFileExists(body.filename))) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }
    
    const embeddings = await EmbeddingUtils.get({ filename: body.filename })
    if (embeddings) {
      return NextResponse.json(embeddings)
    }
    
    const encoder = new TextEncoder()
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    (async () => {
      try {
        const contents = await extractFileContents(body.filename)
        const totalChunks = contents.length
        let processedChunks = 0
        let lastEmbedding = null
        
        for (let i = 0; i < contents.length; i++) {
          const model_response = await ollama.embed({
            model: "mxbai-embed-large",
            input: contents[i]
          })
          
          const newEmbedding = await EmbeddingUtils.create({
            filename: body.filename,
            content: contents[i],
            idx: i,
            model: model_response.model,
            embeddings: model_response.embeddings[0]
          })
          
          lastEmbedding = newEmbedding
          processedChunks++
          
          await writer.write(
            encoder.encode(JSON.stringify({
              progress: {
                current: processedChunks,
                total: totalChunks
              },
              done: false
            }) + '\n')
          )
        }
        
        await writer.write(
          encoder.encode(JSON.stringify({
            embedding: lastEmbedding,
            progress: {
              current: processedChunks,
              total: totalChunks
            },
            done: true
          }) + '\n')
        )
      } catch (error) {
        console.error("Error processing embeddings:", error)
        await writer.write(
          encoder.encode(JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to process embeddings",
            done: true
          }) + '\n')
        )
      } finally {
        await writer.close()
      }
    })()
    
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("Error handling embedding request:", error)
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : "Failed to extract embeddings" 
    }, { status: 500 })
  }
}