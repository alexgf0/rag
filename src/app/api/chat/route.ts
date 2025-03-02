import { claudeProvider } from '@/lib/model-providers/claude';
import { ollamaProvider } from '@/lib/model-providers/ollama';
import { openaiProvider } from '@/lib/model-providers/openai';
import { getRelevantContent } from '@/lib/model-utils'
import { NextRequest, NextResponse } from 'next/server'

const providers = {
  ollama: ollamaProvider,
  claude: claudeProvider,
  openai: openaiProvider
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, reset = false, include_files = false, provider = 'ollama', model = 'deepseek-r1:1.5b' } = body

    if (include_files) {
      const contexts = await getRelevantContent("mxbai-embed-large", messages[messages.length-1].content)

      let fullContext = ""

      for (let i=0; i < contexts.length; i++) {
        fullContext = fullContext + "\n\n" + contexts[i].content
      }

      if (messages.length > 0) {
        messages[messages.length-1].content = 'With the following context: \n' + fullContext + '\n\n Can you response the following question: ' + messages[messages.length-1].content
      }
    }

    // Handle reset request
    if (reset) {
      return NextResponse.json({ status: 'reset' })
    }
    
    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Get the selected provider
    const selectedProvider = providers[provider as keyof typeof providers];
    if (!selectedProvider) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Process the streaming response
    (async () => {
      try {
        const response = await selectedProvider.chat(model, messages);
        
        if (!response.stream || typeof response.processChunk !== 'function') {
          throw new Error('Invalid response format from provider');
        }
        
        for await (const part of (response.stream as AsyncIterable<unknown>)) {
          const processedChunk = response.processChunk(part);
          const chunk = encoder.encode(JSON.stringify({
            content: processedChunk.content,
            done: processedChunk.done
          }) + '\n');
          
          await writer.write(chunk);
          
          if (processedChunk.done) {
            break;
          }
        }
        
        // Signal completion
        await writer.write(
          encoder.encode(JSON.stringify({ content: '', done: true }) + '\n')
        )
      } catch (error) {
        console.error('Stream processing error:', error)
        
        // Extract meaningful error message
        let errorMessage = 'An error occurred during processing';
        if (error instanceof Error) {
          // Try to parse API error messages
          const match = error.message.match(/message":"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = error.message;
          }
        }
        
        await writer.write(
          encoder.encode(JSON.stringify({ 
            error: errorMessage,
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