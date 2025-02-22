"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  id: number
  text: string
  sender: "user" | "system"
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: "Welcome to the chat!", sender: "system" }])
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: input.trim(),
        sender: "user",
      }
      setMessages((prev) => [...prev, newMessage])
      setInput("")
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.sender === "user" ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block p-2 rounded-lg ${m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input value={input} placeholder="Type a message..." onChange={(e) => setInput(e.target.value)} />
          <Button type="submit">Send</Button>
        </form>
      </CardFooter>
    </Card>
  )
}

