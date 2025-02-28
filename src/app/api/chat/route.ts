import { getRelevantContent } from '@/lib/model-utils'
import { NextRequest, NextResponse } from 'next/server'
import ollama from 'ollama'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, reset = false, include_files = false } = body

    if (include_files) {
        // get the query embeddings and compare against what we already have to form the context.
        getRelevantContent("mxbai-embed-large", messages[messages.length-1].content)
    }
    
    console.log("messages: ", messages)

    // Handle reset request
    if (reset) {
      return NextResponse.json({ status: 'reset' })
    }
    
    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    
    // Start processing with Ollama
    const ollamaPromise = ollama.chat({
      model: 'deepseek-r1:1.5b',
      messages,
      stream: true
    })

    // Process the streaming response from Ollama
    ;(async () => {
      try {
        const ollamaResponse = await ollamaPromise
        
        for await (const part of ollamaResponse) {
          const chunk = encoder.encode(JSON.stringify({
            content: part.message.content,
            done: false
          }) + '\n')
          await writer.write(chunk)
        }
        
        // Signal completion
        await writer.write(
          encoder.encode(JSON.stringify({ content: '', done: true }) + '\n')
        )
      } catch (error) {
        console.error('Stream processing error:', error)
        await writer.write(
          encoder.encode(JSON.stringify({ 
            error: 'An error occurred during processing',
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
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}