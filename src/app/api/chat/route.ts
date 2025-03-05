import { claudeProvider } from "@/lib/model-providers/claude"
import { ollamaProvider } from "@/lib/model-providers/ollama"
import { openaiProvider } from "@/lib/model-providers/openai"
import { getRelevantContent } from "@/lib/model-utils"
import { type NextRequest, NextResponse } from "next/server"

// Get the embedding model from environment variables with fallback
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "mxbai-embed-large"

const providers = {
  ollama: ollamaProvider,
  claude: claudeProvider,
  openai: openaiProvider,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, reset = false, include_files = false, provider = "ollama", model = "deepseek-r1:1.5b" } = body

    // Store file chunks to include in the response
    const fileChunks = []

    // Set a longer timeout for the request
    request.signal.onabort = () => {
      console.log("Request was aborted by the client")
    }

    if (include_files) {
      const contexts = await getRelevantContent(EMBEDDING_MODEL, messages[messages.length - 1].content)
      let fullContext = ""

      // Process each relevant chunk
      for (let i = 0; i < contexts.length; i++) {
        const chunk = contexts[i]
        fullContext = fullContext + "\n\n" + chunk.content

        // Store file chunk information
        fileChunks.push({
          filename: chunk.filename,
          content: chunk.content,
        })
      }

      if (messages.length > 0) {
        messages[messages.length - 1].content =
          "With the following context: \n" +
          fullContext +
          "\n\n Respond to the following question: " +
          messages[messages.length - 1].content
      }
    }

    // Handle reset request
    if (reset) {
      return NextResponse.json({ status: "reset" })
    }

    // Create a streaming response with a longer timeout
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Get the selected provider
    const selectedProvider = providers[provider as keyof typeof providers]
    if (!selectedProvider) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }
    // Process the streaming response
    ;(async () => {
      try {
        const response = await selectedProvider.chat(model, messages)

        if (!response.stream || typeof response.processChunk !== "function") {
          throw new Error("Invalid response format from provider")
        }

        const keepAliveInterval = setInterval(async () => {
          try {
            // Send a keep-alive comment to prevent connection timeout
            await writer.write(encoder.encode(": keep-alive\n\n"))
          } catch {
            // If writing fails, clear the interval
            clearInterval(keepAliveInterval)
          }
        }, 15000); // Send keep-alive every 15 seconds

        try {
          for await (const part of response.stream as AsyncIterable<unknown>) {
            const processedChunk = response.processChunk(part)
            const chunk = encoder.encode(
              JSON.stringify({
                content: processedChunk.content,
                done: processedChunk.done,
                fileChunks: processedChunk.done ? fileChunks : undefined, // Only send file chunks when done
              }) + "\n",
            )

            try {
              await writer.write(chunk)
            } catch (writeError) {
              console.error("Error writing to stream:", writeError)
              clearInterval(keepAliveInterval)
              break
            }

            if (processedChunk.done) {
              break
            }
          }
        } catch (streamError) {
          console.error("Stream processing error:", streamError)
          throw streamError
        }

        // Clear the keep-alive interval when done
        clearInterval(keepAliveInterval)

        // Signal completion
        try {
          await writer.write(
            encoder.encode(
              JSON.stringify({
                content: "",
                done: true,
                fileChunks, // Include file chunks in the final message
              }) + "\n",
            ),
          )
        } catch (finalWriteError) {
          console.error("Error writing final message:", finalWriteError)
          // We'll continue to close the writer even if this fails
        }
      } catch (error) {
        console.error("Stream processing error:", error)

        // Extract meaningful error message
        let errorMessage = "An error occurred during processing"
        if (error instanceof Error) {
          // Try to parse API error messages
          const match = error.message.match(/message":"([^"]+)"/)
          if (match && match[1]) {
            errorMessage = match[1]
          } else {
            errorMessage = error.message
          }
        }

        try {
          await writer.write(
            encoder.encode(
              JSON.stringify({
                error: errorMessage,
                done: true,
              }) + "\n",
            ),
          )
        } catch (errorWriteError) {
          console.error("Error writing error message:", errorWriteError)
          // Continue to close the writer even if this fails
        }
      } finally {
        try {
          await writer.close()
        } catch (closeError) {
          console.error("Error closing writer:", closeError)
        }
      }
    })()

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}