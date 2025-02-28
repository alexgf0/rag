"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, EyeOff, FileCheck, FileX, SquarePen } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Message = {
  id: number
  text: string
  sender: "user" | "system"
  complete?: boolean
  hasThinkContent?: boolean
  originalText?: string
}

export default function ChatInterface() {
  const initialWelcomeMessage = { 
    id: 1, 
    text: "Welcome to the chat! Ask me anything.", 
    sender: "system", 
    complete: true 
  }
  
  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage as Message])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showThinking, setShowThinking] = useState(true)
  const [includeFiles, setIncludeFiles] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState(40) // Default height in pixels
  const messageEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to auto-resize the textarea and adjust the chat area
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to properly calculate the new height
      textarea.style.height = 'auto'
      
      // Calculate new height (capped at maximum)
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200)
      textarea.style.height = `${newHeight}px`
      
      // Update height state to resize the chat area
      setTextareaHeight(newHeight)
    }
  }

  // Resize the textarea when input changes
  useEffect(() => {
    autoResizeTextarea()
  }, [input])

  const transformMessagesForOllama = (messages: Message[]) => {
    // Skip the welcome message and transform remaining messages
    return messages.slice(1).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }))
  }

  // Function to reset the chat
  const resetChat = () => {
    setMessages([initialWelcomeMessage as Message])
    setInput("")
    setIsLoading(false)
    setTextareaHeight(40) // Reset textarea height
  }

  // Function to process and extract think sections from text
  const processThinkSections = (text: string): { 
    processedText: string, 
    hasThinkContent: boolean,
    originalText: string 
  } => {
    const originalText = text
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g
    
    // Check if there are think tags
    const hasThinkContent = thinkRegex.test(text)
    
    if (!hasThinkContent) {
      return { processedText: text, hasThinkContent, originalText }
    }
    
    // Reset regex state
    thinkRegex.lastIndex = 0
    
    // For compressed view, we'll remove the think sections completely
    const processedText = text.replace(thinkRegex, '')
      // Clean up any double newlines left by the removal
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
    
    return { processedText, hasThinkContent, originalText }
  }

  // Toggle thinking visibility for all messages
  const toggleThinking = () => {
    setShowThinking(prev => !prev)
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.hasThinkContent) {
          return {
            ...msg,
            text: !showThinking ? msg.originalText! : processThinkSections(msg.originalText!).processedText
          }
        }
        return msg
      })
    )
  }

  // Handle key press for submitting with Enter (but allow Shift+Enter for new lines)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now(),
        text: input.trim(),
        sender: "user",
        complete: true
      }
      
      const aiMessageId = Date.now() + 1
      setMessages(prev => [...prev, userMessage, {
        id: aiMessageId,
        text: "",
        sender: "system",
        complete: false
      }])
      setInput("")
      setIsLoading(true)
      
      // Reset textarea height
      setTextareaHeight(40)
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px'
      }

      try {
        // Get the current conversation history and add the new message
        const conversationHistory = transformMessagesForOllama(messages)
        conversationHistory.push({ role: "user", content: input.trim() })

        // Call the API endpoint with streaming response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: conversationHistory,
            reset: false, // Indicate this is not a reset request
            include_files: includeFiles
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is null')
        }

        // Process the incoming stream chunks
        const decoder = new TextDecoder()
        let buffer = ''
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })
          
          // Process complete JSON lines from the buffer
          let newlineIndex
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex)
            buffer = buffer.slice(newlineIndex + 1)
            
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                
                if (data.error) {
                  throw new Error(data.error)
                }
                
                // Update the full response and the displayed message
                if (data.content) {
                  fullResponse += data.content
                  
                  // Check if we need to process think sections
                  const { processedText, hasThinkContent } = processThinkSections(fullResponse)
                  
                  // Update the AI message with new content
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          text: showThinking ? fullResponse : processedText,
                          hasThinkContent,
                          originalText: fullResponse
                        }
                      : msg
                  ))
                }
                
                // Mark message as complete when done
                if (data.done) {
                  // Final processing of the complete response
                  const { processedText, hasThinkContent } = processThinkSections(fullResponse)
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          text: showThinking ? fullResponse : processedText,
                          complete: true,
                          hasThinkContent,
                          originalText: fullResponse
                        }
                      : msg
                  ))
                }
              } catch (e) {
                console.error('Error parsing stream:', e, line)
              }
            }
          }
        }

      } catch (error) {
        console.error('Error:', error)
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: "Sorry, I encountered an error. Please try again.", complete: true }
            : msg
        ))
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle reset chat with backend notification
  const handleResetChat = async () => {
    // Notify the backend about the reset
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [],
          reset: true // Signal that this is a reset request
        }),
      })
    } catch (error) {
      console.error('Error notifying reset:', error)
    }
    
    // Reset the chat UI
    resetChat()
  }

  // Render individual message with think toggle if applicable
  const renderMessage = (message: Message) => {
    return (
      <div key={message.id} className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}>
        <span
          className={`inline-block p-2 rounded-lg ${
            message.sender === "user" 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          } ${!message.complete ? "animate-pulse" : ""}`}
        >
          {message.text || "..."}
        </span>
      </div>
    )
  }

  // Calculate dynamic height for chat area that shrinks as textarea grows
  const chatAreaHeight = `calc(100vh - ${textareaHeight + 160}px)`

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <CardTitle>Chat with AI</CardTitle>
          <div className="flex gap-1">
            <Switch 
              id="thinking-mode" 
              checked={showThinking} 
              onCheckedChange={toggleThinking} 
            />
            <Label htmlFor="thinking-mode" className="flex items-center cursor-pointer">
              {showThinking ? (
                <><Eye className="h-4 w-4 mr-1" /> Show Thinking</>
              ) : (
                <><EyeOff className="h-4 w-4 mr-1" /> Show Thinking</>
              )}
            </Label>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetChat}
            disabled={isLoading}
            className="flex items-center"
          >
            <SquarePen className="h-4 w-4" />
            New Chat
          </Button>
          <div className="flex gap-3">
            <Switch 
              id="include-files" 
              checked={includeFiles} 
              onCheckedChange={setIncludeFiles} 
            />
            <Label htmlFor="include-files" className="flex items-center cursor-pointer gap-2">
              {includeFiles ? (
                <><FileCheck className="h-4 w-4 mr-1" /> Include files</>
              ) : (
                <><FileX className="h-4 w-4 mr-1" />Include files</>
              )}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pr-3 overflow-hidden">
        {/* Use dynamic height that adjusts based on textarea size */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="pr-4"
          style={{ height: chatAreaHeight }}
        >
          <div className="flex flex-col space-y-4">
            {messages.map(renderMessage)}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-2">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2 items-end">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              placeholder="Type a message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="resize-none pr-12 py-2"
              style={{ 
                height: `${textareaHeight}px`,
                minHeight: '40px',
                maxHeight: '200px',
                overflowY: textareaHeight >= 200 ? 'auto' : 'hidden'
              }}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}