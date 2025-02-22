"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import ollama from 'ollama/browser'

type Message = {
  id: number
  text: string
  sender: "user" | "system"
  complete?: boolean
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to the chat! Ask me anything.", sender: "system", complete: true }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const transformMessagesForOllama = (messages: Message[]) => {
    // Skip the welcome message and transform remaining messages
    return messages.slice(1).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }))
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

      try {
        // Get the current conversation history and add the new message
        const conversationHistory = transformMessagesForOllama(messages)
        conversationHistory.push({ role: "user", content: input.trim() })

        const response = await ollama.chat({
          model: 'deepseek-r1:1.5b',
          messages: conversationHistory,
          stream: true
        })

        for await (const part of response) {
          const newContent = part.message.content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: msg.text + newContent }
              : msg
          ))
        }

        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, complete: true }
            : msg
        ))
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

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Chat with AI</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="flex flex-col space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`mb-4 ${m.sender === "user" ? "text-right" : "text-left"}`}>
                <span
                  className={`inline-block p-2 rounded-lg ${
                    m.sender === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground"
                  } ${!m.complete ? "animate-pulse" : ""}`}
                >
                  {m.text || "..."}
                </span>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input 
            value={input} 
            placeholder="Type a message..." 
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}